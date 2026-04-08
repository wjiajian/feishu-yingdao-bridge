import crypto from "node:crypto";

import { buildAppFormCard, buildAppListCard, buildSubmitSuccessCard } from "../core/card-builder.js";
import { checkAppPermission, filterAuthorizedApps } from "../core/permission-service.js";

function formatDisplayTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).replace("T", " ").replace(/\+08:00$/, "");
  }

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const getValue = (type) => parts.find((item) => item.type === type)?.value ?? "";

  return `${getValue("year")}-${getValue("month")}-${getValue("day")} ${getValue("hour")}:${getValue("minute")}:${getValue("second")}`;
}

function createToast(type, content) {
  return {
    type,
    content
  };
}

function collectFormValues(app, actionValue) {
  const values = {};

  for (const field of app.fields ?? []) {
    if (actionValue[field.fieldKey] !== undefined) {
      values[field.fieldKey] = actionValue[field.fieldKey];
    }
  }

  return values;
}

function validateField(field, value) {
  const stringValue = value === undefined || value === null ? "" : String(value).trim();

  if (field.required && !stringValue) {
    return `${field.fieldLabel}不能为空`;
  }

  if (stringValue && field.validationRegex) {
    const regex = new RegExp(field.validationRegex);
    if (!regex.test(stringValue)) {
      return field.validationMessage || `${field.fieldLabel}格式不正确`;
    }
  }

  return null;
}

function findApp(config, appCode) {
  return (config.apps ?? []).find((item) => item.appCode === appCode);
}

function parseActionName(actionName, actionValue = {}) {
  if (!actionName) {
    return {
      actionName: actionValue.action || "",
      appCode: actionValue.appCode || "",
      formVersion: actionValue.formVersion || ""
    };
  }

  if (!actionName.includes(":")) {
    return {
      actionName,
      appCode: actionValue.appCode || "",
      formVersion: actionValue.formVersion || ""
    };
  }

  const [baseActionName, appCode, formVersion] = actionName.split(":");

  return {
    actionName: baseActionName,
    appCode: appCode || actionValue.appCode || "",
    formVersion: formVersion || actionValue.formVersion || ""
  };
}

export function createFeishuHandler({
  configService,
  feishuClient,
  yingdaoService,
  now = () => new Date().toISOString(),
  createRequestId = () => crypto.randomUUID(),
  menuEventKey = "open_shadowbot_apps",
  logger = console
}) {
  return {
    async handleEvent(event) {
      if (event.type !== "menu_click") {
        return { ok: true };
      }

       if (event.eventKey && event.eventKey !== menuEventKey) {
        return { ok: true };
      }

      const config = await configService.getConfig();
      const apps = filterAuthorizedApps({
        apps: config.apps,
        openId: event.operator.openId,
        now: now()
      });
      const card = buildAppListCard({ apps });

      await feishuClient.sendCardMessage({
        chatId: event.message.chatId,
        openId: event.operator.openId,
        card
      });

      return { ok: true };
    },

    async handleCardAction(payload) {
      const config = await configService.getConfig();
      const actionValue = payload.action.value ?? {};
      const parsedAction = parseActionName(payload.action.name, actionValue);
      const actionName = parsedAction.actionName;
      const app = findApp(config, parsedAction.appCode);

      if (!app) {
        return {
          toast: createToast("error", "未找到对应应用")
        };
      }

      const permissionResult = checkAppPermission({
        app,
        openId: payload.operator.openId,
        now: now()
      });

      if (!permissionResult.allowed) {
        return {
          toast: createToast("error", permissionResult.reason)
        };
      }

      if (actionName === "open_app_form") {
        return {
          card: buildAppFormCard({ app })
        };
      }

      if (actionName === "cancel_app_form") {
        return {
          toast: createToast("info", "已取消")
        };
      }

      if (actionName !== "submit_app_form") {
        return {
          toast: createToast("error", "不支持的动作类型")
        };
      }

      if (Number(parsedAction.formVersion) !== Number(app.formVersion)) {
        return {
          toast: createToast("error", "表单版本已过期，请重新打开")
        };
      }

      const values = collectFormValues(app, actionValue);
      const validationErrors = [];

      for (const field of app.fields ?? []) {
        const error = validateField(field, values[field.fieldKey]);
        if (error) {
          validationErrors.push(error);
        }
      }

      if (validationErrors.length > 0) {
        return {
          card: buildAppFormCard({ app, values, errors: validationErrors }),
          toast: createToast("error", validationErrors[0])
        };
      }

      const requestId = createRequestId();
      const submittedAt = now();
      Promise.resolve()
        .then(() =>
          yingdaoService.trigger({
            app,
            user: {
              openId: payload.operator.openId,
              name: payload.operator.name || ""
            },
            requestId,
            submittedAt,
            values
          })
        )
        .catch((error) => {
          logger.error(
            "[yingdao-trigger] failed:",
            error instanceof Error ? error.stack || error.message : String(error)
          );
        });

      return {
        card: buildSubmitSuccessCard({
          appName: app.appName,
          requestId,
          submittedAt: formatDisplayTime(submittedAt),
          successText: app.successText
        }),
        toast: createToast("success", app.successText || "已提交")
      };
    }
  };
}
