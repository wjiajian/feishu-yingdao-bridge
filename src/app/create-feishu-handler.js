import crypto from "node:crypto";

import {
  buildAppFormCard,
  buildAppListCard,
  buildCancelResultCard,
  buildSubmitSuccessCard
} from "../core/card-builder.js";
import { createMenuEventGuard } from "./menu-event-guard.js";
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

function writeLog(logger, level, event, fields) {
  const method = logger?.[level];

  if (typeof method === "function") {
    method.call(logger, event, fields);
  }
}

function normalizeTimestamp(value) {
  if (value === undefined || value === null || value === "") {
    return Number.NaN;
  }

  let numericValue = Number.NaN;

  if (typeof value === "number") {
    numericValue = value;
  } else {
    const stringValue = String(value).trim();

    if (stringValue === "") {
      return Number.NaN;
    }

    numericValue = Number(stringValue);

    if (!Number.isFinite(numericValue)) {
      const parsedValue = Date.parse(stringValue);
      return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
    }
  }

  if (!Number.isFinite(numericValue)) {
    return Number.NaN;
  }

  const absoluteValue = Math.abs(Math.trunc(numericValue));
  const digitCount = absoluteValue === 0 ? 1 : Math.floor(Math.log10(absoluteValue)) + 1;

  return digitCount <= 10 ? numericValue * 1_000 : numericValue;
}

function isStaleMenuEvent(event, currentTime, maxMenuEventAgeMs) {
  if (maxMenuEventAgeMs <= 0) {
    return false;
  }

  const eventTimestamp = normalizeTimestamp(event.createTime);
  const currentTimestamp = normalizeTimestamp(currentTime);

  if (!Number.isFinite(eventTimestamp) || !Number.isFinite(currentTimestamp)) {
    return false;
  }

  if (eventTimestamp > currentTimestamp) {
    return false;
  }

  return currentTimestamp - eventTimestamp > maxMenuEventAgeMs;
}

function buildMenuLogFields(event, menuEventKey, extraFields = {}) {
  return {
    eventId: event.eventId || "",
    openId: event.operator?.openId || "",
    eventKey: event.eventKey || menuEventKey,
    createTime: event.createTime || "",
    chatId: event.message?.chatId || "",
    ...extraFields
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
  maxMenuEventAgeMs = 2 * 60_000,
  logger = console,
  menuEventGuard = createMenuEventGuard()
}) {
  return {
    async handleEvent(event) {
      if (event.type !== "menu_click") {
        return { ok: true };
      }

      if (event.eventKey && event.eventKey !== menuEventKey) {
        return { ok: true };
      }

      const currentTime = now();

      if (isStaleMenuEvent(event, currentTime, maxMenuEventAgeMs)) {
        writeLog(
          logger,
          "warn",
          "feishu.menu.stale_ignored",
          buildMenuLogFields(event, menuEventKey)
        );
        return { ok: true };
      }

      const reservationResult = menuEventGuard.reserve({
        eventId: event.eventId,
        openId: event.operator.openId,
        eventKey: event.eventKey || menuEventKey
      });

      if (!reservationResult.allowed) {
        writeLog(
          logger,
          "warn",
          reservationResult.reason === "duplicate_event"
            ? "feishu.menu.duplicate_ignored"
            : "feishu.menu.throttled",
          buildMenuLogFields(event, menuEventKey)
        );
        return { ok: true };
      }

      try {
        const config = await configService.getConfig();
        const apps = filterAuthorizedApps({
          apps: config.apps,
          openId: event.operator.openId,
          now: currentTime
        });
        const card = buildAppListCard({ apps });

        await feishuClient.sendCardMessage({
          chatId: event.message.chatId,
          openId: event.operator.openId,
          card
        });
        writeLog(logger, "info", "feishu.menu.card_sent", buildMenuLogFields(event, menuEventKey, {
          appCount: apps.length
        }));
      } catch (error) {
        menuEventGuard.release(reservationResult.reservation);
        writeLog(logger, "error", "feishu.menu.card_send_failed", buildMenuLogFields(event, menuEventKey, {
          error: error instanceof Error ? error.message : String(error)
        }));
        throw error;
      }

      return { ok: true };
    },

    async handleCardAction(payload) {
      const config = await configService.getConfig();
      const actionValue = payload.action.value ?? {};
      const parsedAction = parseActionName(payload.action.name, actionValue);
      const actionName = parsedAction.actionName;
      const app = findApp(config, parsedAction.appCode);
      const baseActionFields = {
        actionName,
        appCode: parsedAction.appCode,
        openId: payload.operator.openId,
        chatId: payload.context?.chatId || "",
        messageId: payload.context?.messageId || ""
      };

      if (!app) {
        writeLog(logger, "warn", "feishu.card.app_not_found", baseActionFields);
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
        writeLog(logger, "warn", "feishu.card.permission_denied", {
          ...baseActionFields,
          appCode: app.appCode,
          reason: permissionResult.reason
        });
        return {
          toast: createToast("error", permissionResult.reason)
        };
      }

      if (actionName === "open_app_form") {
        writeLog(logger, "info", "feishu.card.open_form", {
          ...baseActionFields,
          appCode: app.appCode,
          fieldCount: app.fields?.length || 0
        });
        return {
          card: buildAppFormCard({ app })
        };
      }

      if (actionName === "cancel_app_form") {
        writeLog(logger, "info", "feishu.card.cancelled", {
          ...baseActionFields,
          appCode: app.appCode
        });
        return {
          card: buildCancelResultCard({
            appName: app.appName
          }),
          toast: createToast("info", "已取消")
        };
      }

      if (actionName !== "submit_app_form") {
        writeLog(logger, "warn", "feishu.card.unsupported_action", {
          ...baseActionFields,
          appCode: app.appCode
        });
        return {
          toast: createToast("error", "不支持的动作类型")
        };
      }

      if (Number(parsedAction.formVersion) !== Number(app.formVersion)) {
        writeLog(logger, "warn", "feishu.form.version_expired", {
          ...baseActionFields,
          appCode: app.appCode,
          formVersion: parsedAction.formVersion,
          currentFormVersion: app.formVersion
        });
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
        writeLog(logger, "warn", "feishu.form.validation_failed", {
          ...baseActionFields,
          appCode: app.appCode,
          fieldKeys: Object.keys(values),
          errorCount: validationErrors.length
        });
        return {
          card: buildAppFormCard({ app, values, errors: validationErrors }),
          toast: createToast("error", validationErrors[0])
        };
      }

      const requestId = createRequestId();
      const submittedAt = now();

      writeLog(logger, "info", "feishu.form.submitted", {
        ...baseActionFields,
        appCode: app.appCode,
        requestId,
        fieldKeys: Object.keys(values)
      });

      Promise.resolve()
        .then(() => {
          writeLog(logger, "info", "yingdao.trigger.started", {
            appCode: app.appCode,
            openId: payload.operator.openId,
            requestId,
            fieldKeys: Object.keys(values)
          });
          return yingdaoService.trigger({
            app,
            user: {
              openId: payload.operator.openId,
              name: payload.operator.name || ""
            },
            requestId,
            submittedAt,
            values
          });
        })
        .then(() => {
          writeLog(logger, "info", "yingdao.trigger.succeeded", {
            appCode: app.appCode,
            openId: payload.operator.openId,
            requestId
          });
        })
        .catch((error) => {
          writeLog(logger, "error", "yingdao.trigger.failed", {
            appCode: app.appCode,
            openId: payload.operator.openId,
            requestId,
            error: error instanceof Error ? error.message : String(error)
          });
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
