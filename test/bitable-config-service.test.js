import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { createBitableConfigService } from "../src/services/bitable-config-service.js";

defineTest("createBitableConfigService 只读取 apps 与 permissions 两张表", async () => {
  const calls = [];
  const service = createBitableConfigService({
    bitableClient: {
      async listAllRecords(payload) {
        calls.push(payload);
        if (payload.tableId === "tblApps") {
          return [
            {
              fields: {
                app_code: "expense_form",
                app_name: "报销表单",
                enabled: true,
                display_order: 10,
                form_url: "https://console.yingdao.com/form/123"
              }
            }
          ];
        }

        return [
          {
            fields: {
              app_code: "expense_form",
              feishu_open_id: "ou_123",
              enabled: true
            }
          }
        ];
      }
    },
    bitable: {
      appToken: "bascn_xxx",
      appsTableId: "tblApps",
      permissionsTableId: "tblPermissions"
    }
  });

  const config = await service.getConfig();

  assert.equal(calls.length, 2);
  assert.deepEqual(
    calls.map((item) => item.tableId),
    ["tblApps", "tblPermissions"]
  );
  assert.equal(config.apps[0].appCode, "expense_form");
  assert.equal(config.apps[0].permissions[0].openId, "ou_123");
});
