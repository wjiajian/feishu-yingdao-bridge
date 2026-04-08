import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import {
  summarizeFeishuCallbackBody,
  summarizeMappedFeishuEvent
} from "../src/app/feishu-callback-log.js";

defineTest("summarizeFeishuCallbackBody 提取飞书回调摘要字段", () => {
  const summary = summarizeFeishuCallbackBody({
    schema: "2.0",
    header: {
      event_id: "evt_1",
      event_type: "card.action.trigger"
    },
    event: {
      operator: {
        open_id: "ou_123"
      },
      action: {
        name: "submit_app_form:leave_sync:1"
      },
      context: {
        open_message_id: "om_123",
        open_chat_id: "oc_123"
      }
    }
  });

  assert.equal(summary.eventType, "card.action.trigger");
  assert.equal(summary.eventId, "evt_1");
  assert.equal(summary.openId, "ou_123");
  assert.equal(summary.actionName, "submit_app_form:leave_sync:1");
  assert.equal(summary.messageId, "om_123");
  assert.equal(summary.chatId, "oc_123");
});

defineTest("summarizeMappedFeishuEvent 提取映射后的事件摘要字段", () => {
  const summary = summarizeMappedFeishuEvent({
    kind: "card_action",
    payload: {
      operator: {
        openId: "ou_123"
      },
      action: {
        name: "open_app_form",
        value: {
          appCode: "leave_sync"
        }
      },
      context: {
        messageId: "om_123",
        chatId: "oc_123"
      }
    }
  });

  assert.deepEqual(summary, {
    kind: "card_action",
    openId: "ou_123",
    actionName: "open_app_form",
    appCode: "leave_sync",
    messageId: "om_123",
    chatId: "oc_123"
  });
});
