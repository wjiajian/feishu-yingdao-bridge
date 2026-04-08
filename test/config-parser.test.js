import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { parseBitableConfig } from "../src/core/config-parser.js";

defineTest("parseBitableConfig 将多维表格记录转换为应用配置", () => {
  const config = parseBitableConfig({
    apps: [
      {
        fields: {
          app_code: "leave_sync",
          app_name: "请假同步",
          enabled: true,
          display_order: 10,
          description: "同步请假单",
          webhook_url: "https://example.com/webhook",
          webhook_method: "POST",
          timeout_seconds: 15,
          success_text: "已提交",
          payload_meta_prefix: "_meta_",
          form_version: 2
        }
      }
    ],
    fields: [
      {
        fields: {
          app_code: "leave_sync",
          field_key: "employee_no",
          field_label: "工号",
          field_type: "text",
          required: true,
          placeholder: "请输入工号",
          default_type: "none",
          default_value: "",
          validation_regex: "^\\d{6}$",
          validation_message: "工号必须为 6 位数字",
          sort_order: 10,
          enabled: true
        }
      }
    ],
    options: [],
    permissions: [
      {
        fields: {
          app_code: "leave_sync",
          feishu_open_id: "ou_123",
          enabled: true,
          valid_from: "2026-04-01T00:00:00+08:00",
          valid_to: "2026-04-30T23:59:59+08:00"
        }
      }
    ]
  });

  assert.equal(config.apps.length, 1);
  assert.equal(config.apps[0].appCode, "leave_sync");
  assert.equal(config.apps[0].fields[0].fieldKey, "employee_no");
  assert.equal(config.apps[0].permissions[0].openId, "ou_123");
});

defineTest("parseBitableConfig 在字段键重复时抛出异常", () => {
  assert.throws(
    () =>
      parseBitableConfig({
        apps: [
          {
            fields: {
              app_code: "leave_sync",
              app_name: "请假同步",
              enabled: true,
              display_order: 10,
              webhook_url: "https://example.com/webhook"
            }
          }
        ],
        fields: [
          {
            fields: {
              app_code: "leave_sync",
              field_key: "employee_no",
              field_label: "工号",
              field_type: "text",
              required: true,
              sort_order: 10,
              enabled: true
            }
          },
          {
            fields: {
              app_code: "leave_sync",
              field_key: "employee_no",
              field_label: "重复工号",
              field_type: "text",
              required: true,
              sort_order: 20,
              enabled: true
            }
          }
        ],
        options: [],
        permissions: []
      }),
    /field_key 重复/
  );
});

defineTest("parseBitableConfig 能从对象字段中提取 webhook_url 字符串", () => {
  const config = parseBitableConfig({
    apps: [
      {
        fields: {
          app_code: "leave_sync",
          app_name: "请假同步",
          enabled: true,
          display_order: 10,
          description: "同步请假单",
          webhook_url: {
            link: "https://example.com/webhook"
          },
          webhook_method: "POST",
          timeout_seconds: 15,
          success_text: "已提交",
          payload_meta_prefix: "_meta_",
          form_version: 2
        }
      }
    ],
    fields: [],
    options: [],
    permissions: []
  });

  assert.equal(config.apps[0].webhookUrl, "https://example.com/webhook");
});
