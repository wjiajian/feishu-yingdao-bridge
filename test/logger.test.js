import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { createLogger } from "../src/core/logger.js";

defineTest("createLogger 在 info 级别过滤 debug 日志", () => {
  const outputs = [];
  const logger = createLogger({
    level: "info",
    sink: (line) => outputs.push(line)
  });

  logger.debug("debug.event", { value: 1 });
  logger.info("info.event", { value: 2 });

  assert.equal(outputs.length, 1);
  const payload = JSON.parse(outputs[0]);
  assert.equal(payload.level, "info");
  assert.equal(payload.event, "info.event");
  assert.equal(payload.value, 2);
});

defineTest("createLogger 输出统一结构化日志", () => {
  const outputs = [];
  const logger = createLogger({
    level: "debug",
    sink: (line) => outputs.push(line)
  });

  logger.warn("menu.throttled", {
    eventId: "evt_1",
    openId: "ou_1"
  });

  assert.equal(outputs.length, 1);
  const payload = JSON.parse(outputs[0]);
  assert.equal(payload.level, "warn");
  assert.equal(payload.event, "menu.throttled");
  assert.equal(payload.eventId, "evt_1");
  assert.equal(payload.openId, "ou_1");
  assert.ok(payload.ts);
});

defineTest("createLogger 默认输出东八区时间", () => {
  const outputs = [];
  const logger = createLogger({
    level: "info",
    sink: (line) => outputs.push(line),
    now: () => "2026-04-08T02:53:48.386Z"
  });

  logger.info("server.started", {});

  const payload = JSON.parse(outputs[0]);
  assert.equal(payload.ts, "2026-04-08T10:53:48+08:00");
});
