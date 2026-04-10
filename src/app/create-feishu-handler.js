import crypto from "node:crypto";

import { buildAppListCard } from "../core/card-builder.js";
import { createMenuEventGuard } from "./menu-event-guard.js";
import { checkAppPermission, filterAuthorizedApps } from "../core/permission-service.js";

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

function findApp(config, appCode) {
  return (config.apps ?? []).find((item) => item.appCode === appCode);
}

function createDepartmentResolver({
  feishuClient,
  cacheTtlMs,
  cacheNow = () => Date.now()
}) {
  const cache = new Map();

  return async function resolveDepartmentIds(openId) {
    if (!openId) {
      return [];
    }

    const currentTime = cacheNow();
    const cached = cache.get(openId);

    if (cached && cached.expiresAt > currentTime) {
      return cached.departmentIds;
    }

    const departmentIds = await feishuClient.getUserDepartmentIds({ openId });
    cache.set(openId, {
      departmentIds,
      expiresAt: currentTime + cacheTtlMs
    });

    return departmentIds;
  };
}

function parseActionName(actionName, actionValue = {}) {
  if (!actionName) {
    return {
      actionName: actionValue.action || "",
      appCode: actionValue.appCode || ""
    };
  }

  if (!actionName.includes(":")) {
    return {
      actionName,
      appCode: actionValue.appCode || ""
    };
  }

  const [baseActionName, appCode] = actionName.split(":");

  return {
    actionName: baseActionName,
    appCode: appCode || actionValue.appCode || ""
  };
}

export function createFeishuHandler({
  configService,
  feishuClient,
  now = () => new Date().toISOString(),
  departmentCacheTtlMs = 5 * 60_000,
  createRequestId = () => crypto.randomUUID(),
  menuEventKey = "open_shadowbot_apps",
  maxMenuEventAgeMs = 2 * 60_000,
  logger = console,
  menuEventGuard = createMenuEventGuard()
}) {
  const resolveDepartmentIds = createDepartmentResolver({
    feishuClient,
    cacheTtlMs: departmentCacheTtlMs
  });

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
        const departmentIds = await resolveDepartmentIds(event.operator.openId);
        const apps = filterAuthorizedApps({
          apps: config.apps,
          openId: event.operator.openId,
          departmentIds,
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
        departmentIds: await resolveDepartmentIds(payload.operator.openId),
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

      writeLog(logger, "warn", "feishu.card.unsupported_action", {
        ...baseActionFields,
        appCode: app.appCode
      });
      return {
        toast: createToast("error", "不支持的动作类型")
      };
    }
  };
}
