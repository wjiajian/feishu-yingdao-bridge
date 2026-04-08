import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { verifyFeishuToken } from "../src/core/feishu-auth.js";

defineTest("verifyFeishuToken 在 token 正确时返回通过", () => {
  const result = verifyFeishuToken({
    body: {
      token: "token-123"
    },
    verificationToken: "token-123"
  });

  assert.equal(result.ok, true);
});

defineTest("verifyFeishuToken 在 token 不匹配时返回拒绝", () => {
  const result = verifyFeishuToken({
    body: {
      header: {
        token: "wrong-token"
      }
    },
    verificationToken: "token-123"
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /token 校验失败/);
});

defineTest("verifyFeishuToken 对旧版卡片回调跳过 Verification Token 校验", () => {
  const result = verifyFeishuToken({
    body: {
      open_id: "ou_123",
      token: "c-legacy-token",
      action: {
        tag: "button",
        value: {
          action: "open_app_form"
        }
      }
    },
    verificationToken: "token-123"
  });

  assert.equal(result.ok, true);
});
