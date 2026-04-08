import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { mapFeishuEvent } from "../src/app/feishu-event-mapper.js";

defineTest("mapFeishuEvent 识别飞书菜单推送事件", () => {
  const result = mapFeishuEvent({
    schema: "2.0",
    header: {
      event_type: "application.bot.menu_v6"
    },
    event: {
      event_key: "open_shadowbot_apps",
      chat_id: "oc_123",
      operator: {
        operator_id: {
          open_id: "ou_123"
        }
      }
    }
  });

  assert.equal(result.kind, "menu_click");
  assert.equal(result.event.type, "menu_click");
  assert.equal(result.event.eventKey, "open_shadowbot_apps");
  assert.equal(result.event.operator.openId, "ou_123");
  assert.equal(result.event.message.chatId, "oc_123");
});

defineTest("mapFeishuEvent 在未知事件结构下返回 unknown", () => {
  const result = mapFeishuEvent({
    header: {
      event_type: "unknown.event"
    },
    event: {
      event_key: "other"
    }
  });

  assert.equal(result.kind, "unknown");
});

defineTest("mapFeishuEvent 识别 schema 2.0 的卡片按钮点击事件", () => {
  const result = mapFeishuEvent({
    schema: "2.0",
    header: {
      event_type: "card.action.trigger"
    },
    event: {
      operator: {
        open_id: "ou_123"
      },
      action: {
        tag: "button",
        value: {
          action: "open_app_form",
          appCode: "leave_sync"
        }
      },
      context: {
        open_chat_id: "oc_123",
        open_message_id: "om_123"
      }
    }
  });

  assert.equal(result.kind, "card_action");
  assert.equal(result.payload.operator.openId, "ou_123");
  assert.equal(result.payload.action.name, "open_app_form");
  assert.equal(result.payload.action.value.appCode, "leave_sync");
});
