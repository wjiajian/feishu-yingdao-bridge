import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { createMenuEventGuard } from "../src/app/menu-event-guard.js";

defineTest("createMenuEventGuard 对同一 event_id 做去重", () => {
  const guard = createMenuEventGuard({
    now: () => 1_000
  });

  const first = guard.reserve({
    eventId: "evt_1",
    openId: "ou_1",
    eventKey: "open_shadowbot_apps"
  });
  const second = guard.reserve({
    eventId: "evt_1",
    openId: "ou_1",
    eventKey: "open_shadowbot_apps"
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(second.reason, "duplicate_event");
});

defineTest("createMenuEventGuard 对同一用户 5 秒内重复点击做节流", () => {
  let currentTime = 1_000;
  const guard = createMenuEventGuard({
    now: () => currentTime,
    throttleWindowMs: 5_000
  });

  const first = guard.reserve({
    eventId: "evt_1",
    openId: "ou_1",
    eventKey: "open_shadowbot_apps"
  });

  currentTime += 1_000;
  const second = guard.reserve({
    eventId: "evt_2",
    openId: "ou_1",
    eventKey: "open_shadowbot_apps"
  });

  currentTime += 5_001;
  const third = guard.reserve({
    eventId: "evt_3",
    openId: "ou_1",
    eventKey: "open_shadowbot_apps"
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, false);
  assert.equal(second.reason, "throttled");
  assert.equal(third.allowed, true);
});

defineTest("createMenuEventGuard 发送失败时释放保留状态", () => {
  const guard = createMenuEventGuard({
    now: () => 1_000
  });

  const first = guard.reserve({
    eventId: "evt_1",
    openId: "ou_1",
    eventKey: "open_shadowbot_apps"
  });

  guard.release(first.reservation);

  const second = guard.reserve({
    eventId: "evt_1",
    openId: "ou_1",
    eventKey: "open_shadowbot_apps"
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
});
