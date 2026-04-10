import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { createFeishuClient } from "../src/adapters/feishu-client.js";

defineTest("createFeishuClient 获取用户直属部门 ID 列表", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });

    if (String(url).includes("/auth/v3/tenant_access_token/internal")) {
      return {
        ok: true,
        async json() {
          return {
            tenant_access_token: "tenant-token",
            expire: 7200
          };
        }
      };
    }

    if (String(url).includes("/contact/v3/users/ou_123")) {
      return {
        ok: true,
        async json() {
          return {
            data: {
              user: {
                department_ids: ["od-dept-001", "od-dept-002"]
              }
            }
          };
        }
      };
    }

    throw new Error(`未预期的请求: ${url}`);
  };

  const client = createFeishuClient({
    appId: "cli_a",
    appSecret: "secret",
    fetchImpl
  });

  const result = await client.getUserDepartmentIds({ openId: "ou_123" });

  assert.deepEqual(result, ["od-dept-001", "od-dept-002"]);
  assert.equal(requests.length, 2);
  assert.match(requests[1].url, /user_id_type=open_id/);
  assert.equal(requests[1].options.headers.Authorization, "Bearer tenant-token");
});
