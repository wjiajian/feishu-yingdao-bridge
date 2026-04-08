import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { buildYingdaoWebhookRequest } from "../src/core/yingdao-service.js";

defineTest("buildYingdaoWebhookRequest 构造扁平 JSON 负载", () => {
  const request = buildYingdaoWebhookRequest({
    app: {
      appCode: "leave_sync",
      webhookUrl: "https://example.com/webhook",
      metaPrefix: "_meta_"
    },
    user: {
      openId: "ou_123",
      name: "张三"
    },
    requestId: "req-001",
    submittedAt: "2026-04-07T12:30:00+08:00",
    values: {
      employee_no: "123456",
      reason: "事假"
    }
  });

  assert.equal(request.url, "https://example.com/webhook");
  assert.equal(request.body.employee_no, "123456");
  assert.equal(request.body._meta_app_code, "leave_sync");
  assert.equal(request.body._meta_user_open_id, "ou_123");
});
