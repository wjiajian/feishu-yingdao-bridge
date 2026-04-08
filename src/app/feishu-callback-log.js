function getOpenId(body = {}) {
  return (
    body.event?.operator?.operator_id?.open_id ||
    body.event?.operator?.open_id ||
    body.operator?.open_id ||
    body.open_id ||
    body.event?.user?.open_id ||
    ""
  );
}

function getActionName(body = {}) {
  return body.event?.action?.name || body.action?.name || body.event?.action?.value?.action || body.action?.value?.action || "";
}

function getAppCode(body = {}) {
  return body.event?.action?.value?.appCode || body.action?.value?.appCode || "";
}

function getMessageId(body = {}) {
  return body.event?.context?.open_message_id || body.open_message_id || "";
}

function getChatId(body = {}) {
  return body.event?.context?.open_chat_id || body.open_chat_id || "";
}

function sanitizeValue(key, value) {
  if (["token", "signature", "encrypt_key", "authorization"].includes(String(key).toLowerCase())) {
    return "[REDACTED]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue("", item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeValue(childKey, childValue)])
    );
  }

  return value;
}

export function sanitizeFeishuCallbackBody(body = {}) {
  return sanitizeValue("", body);
}

export function summarizeFeishuCallbackBody(body = {}) {
  return {
    eventType: body.header?.event_type || body.type || "",
    eventId: body.header?.event_id || "",
    openId: getOpenId(body),
    eventKey: body.event?.event_key || body.event_key || "",
    actionName: getActionName(body),
    appCode: getAppCode(body),
    messageId: getMessageId(body),
    chatId: getChatId(body)
  };
}

export function summarizeMappedFeishuEvent(event = {}) {
  if (event.kind === "url_verification") {
    return {
      kind: event.kind
    };
  }

  if (event.kind === "menu_click") {
    return {
      kind: event.kind,
      eventId: event.event?.eventId || "",
      openId: event.event?.operator?.openId || "",
      eventKey: event.event?.eventKey || "",
      chatId: event.event?.message?.chatId || ""
    };
  }

  if (event.kind === "card_action") {
    return {
      kind: event.kind,
      openId: event.payload?.operator?.openId || "",
      actionName: event.payload?.action?.name || "",
      appCode: event.payload?.action?.value?.appCode || "",
      messageId: event.payload?.context?.messageId || "",
      chatId: event.payload?.context?.chatId || ""
    };
  }

  return {
    kind: event.kind || "unknown"
  };
}
