import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { parseBitableConfig } from "../src/core/config-parser.js";

defineTest("parseBitableConfig 将 apps 与 permissions 转换为应用配置", () => {
  const config = parseBitableConfig({
    apps: [
      {
        fields: {
          app_code: "expense_form",
          app_name: "报销表单",
          enabled: true,
          display_order: 20,
          description: "提交报销附件",
          form_url: "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123",
          success_text: "请在影刀表单中提交"
        }
      }
    ],
    permissions: [
      {
        fields: {
          app_code: "expense_form",
          feishu_open_id: "ou_123",
          feishu_department_id: "od-dept-001",
          enabled: true,
          valid_from: "2026-04-01T00:00:00+08:00",
          valid_to: "2026-04-30T23:59:59+08:00"
        }
      }
    ]
  });

  assert.equal(config.apps.length, 1);
  assert.deepEqual(config.apps[0], {
    appCode: "expense_form",
    appName: "报销表单",
    enabled: true,
    displayOrder: 20,
    description: "提交报销附件",
    formUrl: "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123",
    successText: "请在影刀表单中提交",
    permissions: [
      {
        openId: "ou_123",
        departmentId: "od-dept-001",
        enabled: true,
        validFrom: "2026-04-01T00:00:00+08:00",
        validTo: "2026-04-30T23:59:59+08:00",
        remark: ""
      }
    ]
  });
});

defineTest("parseBitableConfig 支持仅部门授权记录", () => {
  const config = parseBitableConfig({
    apps: [
      {
        fields: {
          app_code: "expense_form",
          app_name: "报销表单",
          enabled: true,
          display_order: 20,
          form_url: "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123"
        }
      }
    ],
    permissions: [
      {
        fields: {
          app_code: "expense_form",
          feishu_department_id: "od-dept-002",
          enabled: true
        }
      }
    ]
  });

  assert.deepEqual(config.apps[0].permissions, [
    {
      openId: "",
      departmentId: "od-dept-002",
      enabled: true,
      validFrom: "",
      validTo: "",
      remark: ""
    }
  ]);
});

defineTest("parseBitableConfig 能从对象字段中提取 form_url 字符串", () => {
  const config = parseBitableConfig({
    apps: [
      {
        fields: {
          app_code: "expense_form",
          app_name: "报销表单",
          enabled: true,
          display_order: 20,
          form_url: {
            link: "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=456"
          },
          success_text: "请在影刀表单中提交"
        }
      }
    ],
    permissions: []
  });

  assert.equal(
    config.apps[0].formUrl,
    "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=456"
  );
});

defineTest("parseBitableConfig 按 display_order 排序并忽略未启用应用", () => {
  const config = parseBitableConfig({
    apps: [
      {
        fields: {
          app_code: "disabled_app",
          app_name: "停用应用",
          enabled: false,
          display_order: 5,
          form_url: "https://console.yingdao.com/form/disabled"
        }
      },
      {
        fields: {
          app_code: "second_app",
          app_name: "第二个应用",
          enabled: true,
          display_order: 20,
          form_url: "https://console.yingdao.com/form/second"
        }
      },
      {
        fields: {
          app_code: "first_app",
          app_name: "第一个应用",
          enabled: true,
          display_order: 10,
          form_url: "https://console.yingdao.com/form/first"
        }
      }
    ],
    permissions: []
  });

  assert.deepEqual(
    config.apps.map((app) => app.appCode),
    ["first_app", "second_app"]
  );
});
