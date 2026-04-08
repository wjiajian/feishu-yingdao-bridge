import { tests } from "./test-harness.js";

await import("./config-parser.test.js");
await import("./env-loader.test.js");
await import("./feishu-event-mapper.test.js");
await import("./menu-event-guard.test.js");
await import("./permission-service.test.js");
await import("./card-builder.test.js");
await import("./feishu-callback-response.test.js");
await import("./yingdao-service.test.js");
await import("./feishu-auth.test.js");
await import("./feishu-handler.test.js");

let failed = 0;

for (const item of tests) {
  try {
    await item.run();
    console.log(`PASS ${item.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${item.name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
  console.error(`\n${failed} 个测试失败`);
} else {
  console.log(`\n${tests.length} 个测试全部通过`);
}
