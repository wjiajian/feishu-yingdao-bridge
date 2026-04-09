import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { loadEnv } from "../src/config/env.js";

function withEnv(vars, run) {
  const keys = Object.keys(vars);
  const previous = new Map(keys.map((key) => [key, process.env[key]]));

  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    run();
  } finally {
    for (const key of keys) {
      const value = previous.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

defineTest("loadEnv 只要求 apps 与 permissions 两张表的环境变量", () => {
  withEnv(
    {
      FEISHU_APP_ID: "cli_xxx",
      FEISHU_APP_SECRET: "secret_xxx",
      BITABLE_APP_TOKEN: "bascn_xxx",
      BITABLE_APPS_TABLE_ID: "tblApps",
      BITABLE_PERMISSIONS_TABLE_ID: "tblPermissions",
      BITABLE_FIELDS_TABLE_ID: undefined,
      BITABLE_OPTIONS_TABLE_ID: undefined
    },
    () => {
      const env = loadEnv();

      assert.equal(env.bitable.appsTableId, "tblApps");
      assert.equal(env.bitable.permissionsTableId, "tblPermissions");
      assert.equal("fieldsTableId" in env.bitable, false);
      assert.equal("optionsTableId" in env.bitable, false);
    }
  );
});

defineTest("loadEnv 缺少 permissions 表环境变量时抛出异常", () => {
  withEnv(
    {
      FEISHU_APP_ID: "cli_xxx",
      FEISHU_APP_SECRET: "secret_xxx",
      BITABLE_APP_TOKEN: "bascn_xxx",
      BITABLE_APPS_TABLE_ID: "tblApps",
      BITABLE_PERMISSIONS_TABLE_ID: undefined
    },
    () => {
      assert.throws(() => loadEnv(), /BITABLE_PERMISSIONS_TABLE_ID/);
    }
  );
});
