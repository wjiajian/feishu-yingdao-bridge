function getOperatorOpenId(event = {}, body = {}) {
  return (
    event.operator?.operator_id?.open_id ||
    event.operator?.open_id ||
    event.user?.open_id ||
    body.open_id ||
    body.operator?.open_id ||
    body.user_id ||
    ""
  );
}

function getChatId(event = {}) {
  return event.chat_id || event.open_chat_id || event.chat?.chat_id || event.context?.open_chat_id || "";
}

function isMenuEvent(body = {}) {
  const eventType = body.header?.event_type || body.type || "";
  const eventKey = body.event?.event_key || body.event_key || "";
  const openId = getOperatorOpenId(body.event, body);

  return (
    eventType === "application.bot.menu_v6" ||
    eventType === "bot.menu_v6" ||
    (eventKey.length > 0 && openId.length > 0)
  );
}

function getCardActionContainer(body = {}) {
  if (body.action) {
    return {
      action: body.action,
      operatorSource: body,
      context: body
    };
  }

  if (body.event?.action) {
    return {
      action: body.event.action,
      operatorSource: body.event,
      context: body.event.context || {}
    };
  }

  return null;
}

export function mapFeishuEvent(body) {
  if (body.type === "url_verification") {
    return {
      kind: "url_verification",
      challenge: body.challenge
    };
  }

  if (isMenuEvent(body)) {
    return {
      kind: "menu_click",
      event: {
        type: "menu_click",
        eventId: body.header?.event_id || "",
        createTime: body.header?.create_time || "",
        eventKey: body.event?.event_key || body.event_key || "",
        operator: {
          openId: getOperatorOpenId(body.event, body)
        },
        message: {
          chatId: getChatId(body.event)
        }
      }
    };
  }

  const cardAction = getCardActionContainer(body);

  if (cardAction) {
    return {
      kind: "card_action",
      payload: {
        operator: {
          openId: getOperatorOpenId(cardAction.operatorSource, body),
          name: cardAction.operatorSource.operator?.name || ""
        },
        action: {
          name: cardAction.action.name || cardAction.action.value?.action,
          value: cardAction.action.form_value
            ? {
                ...cardAction.action.value,
                ...cardAction.action.form_value
              }
            : cardAction.action.value || {}
        },
        context: {
          chatId: cardAction.context.open_chat_id || body.open_chat_id || "",
          messageId: cardAction.context.open_message_id || body.open_message_id || ""
        }
      }
    };
  }

  return {
    kind: "unknown"
  };
}
