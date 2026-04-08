import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { defineTest } from "./test-harness.js";
import { loadDotEnvFile } from "../src/config/dotenv.js";

defineTest("loadDotEnvFile 从 .env 文件加载环境变量", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "shadowbot-dotenv-"));
  const envPath = path.join(tempDir, ".env");

  fs.writeFileSync(
    envPath,
    [
      "FEISHU_APP_ID=cli_test",
      "FEISHU_APP_SECRET=secret_test",
      "BITABLE_APP_TOKEN=bascn_test"
    ].join("\n"),
    "utf8"
  );

  delete process.env.FEISHU_APP_ID;
  delete process.env.FEISHU_APP_SECRET;
  delete process.env.BITABLE_APP_TOKEN;

  loadDotEnvFile({ cwd: tempDir });

  assert.equal(process.env.FEISHU_APP_ID, "cli_test");
  assert.equal(process.env.FEISHU_APP_SECRET, "secret_test");
  assert.equal(process.env.BITABLE_APP_TOKEN, "bascn_test");
});

defineTest("loadDotEnvFile 不覆盖已存在的环境变量", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "shadowbot-dotenv-"));
  const envPath = path.join(tempDir, ".env");

  fs.writeFileSync(envPath, "FEISHU_APP_ID=cli_from_file\n", "utf8");

  process.env.FEISHU_APP_ID = "cli_from_process";

  loadDotEnvFile({ cwd: tempDir });

  assert.equal(process.env.FEISHU_APP_ID, "cli_from_process");
});
