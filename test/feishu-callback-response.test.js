import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { formatFeishuCallbackResponse } from "../src/app/feishu-callback-response.js";

defineTest("formatFeishuCallbackResponse 将原始卡片包装为飞书回调格式", () => {
  const result = formatFeishuCallbackResponse({
    toast: {
      type: "success",
      content: "ok"
    },
    card: {
      header: {
        title: {
          tag: "plain_text",
          content: "标题"
        }
      },
      elements: []
    }
  });

  assert.equal(result.toast.type, "success");
  assert.equal(result.card.type, "raw");
  assert.equal(result.card.data.header.title.content, "标题");
});

defineTest("formatFeishuCallbackResponse 保持空响应为空对象", () => {
  const result = formatFeishuCallbackResponse(undefined);

  assert.deepEqual(result, {});
});
