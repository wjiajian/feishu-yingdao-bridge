import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import {
  checkAppPermission,
  filterAuthorizedApps
} from "../src/core/permission-service.js";

const app = {
  appCode: "leave_sync",
  enabled: true,
  permissions: [
    {
      openId: "ou_allow",
      departmentId: "",
      enabled: true,
      validFrom: "2026-04-01T00:00:00+08:00",
      validTo: "2026-04-30T23:59:59+08:00"
    }
  ]
};

defineTest("checkAppPermission 在有效期内返回允许", () => {
  const result = checkAppPermission({
    app,
    openId: "ou_allow",
    departmentIds: [],
    now: "2026-04-07T12:00:00+08:00"
  });

  assert.equal(result.allowed, true);
});

defineTest("checkAppPermission 在无权限时返回拒绝", () => {
  const result = checkAppPermission({
    app,
    openId: "ou_deny",
    departmentIds: [],
    now: "2026-04-07T12:00:00+08:00"
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /无权限/);
});

defineTest("filterAuthorizedApps 只返回当前用户有权限的应用", () => {
  const apps = [
    app,
    {
      appCode: "expense_sync",
      enabled: true,
      permissions: [
        {
          openId: "ou_other",
          departmentId: "",
          enabled: true
        }
      ]
    }
  ];

  const result = filterAuthorizedApps({
    apps,
    openId: "ou_allow",
    departmentIds: [],
    now: "2026-04-07T12:00:00+08:00"
  });

  assert.deepEqual(
    result.map((item) => item.appCode),
    ["leave_sync"]
  );
});

defineTest("checkAppPermission 在直属部门命中时返回允许", () => {
  const result = checkAppPermission({
    app: {
      ...app,
      permissions: [
        {
          openId: "",
          departmentId: "od-dept-001",
          enabled: true,
          validFrom: "2026-04-01T00:00:00+08:00",
          validTo: "2026-04-30T23:59:59+08:00"
        }
      ]
    },
    openId: "ou_deny",
    departmentIds: ["od-dept-001"],
    now: "2026-04-07T12:00:00+08:00"
  });

  assert.equal(result.allowed, true);
});

defineTest("filterAuthorizedApps 会返回部门授权命中的应用", () => {
  const apps = [
    {
      appCode: "department_app",
      enabled: true,
      permissions: [
        {
          openId: "",
          departmentId: "od-dept-002",
          enabled: true
        }
      ]
    },
    {
      appCode: "other_app",
      enabled: true,
      permissions: [
        {
          openId: "",
          departmentId: "od-dept-003",
          enabled: true
        }
      ]
    }
  ];

  const result = filterAuthorizedApps({
    apps,
    openId: "ou_allow",
    departmentIds: ["od-dept-002"],
    now: "2026-04-07T12:00:00+08:00"
  });

  assert.deepEqual(
    result.map((item) => item.appCode),
    ["department_app"]
  );
});
