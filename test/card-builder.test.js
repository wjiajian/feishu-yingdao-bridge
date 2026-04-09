import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { buildAppListCard } from "../src/core/card-builder.js";

defineTest("buildAppListCard 统一生成影刀表单跳转卡片", () => {
  const card = buildAppListCard({
    apps: [
      {
        appCode: "expense_form",
        appName: "报销表单",
        description: "提交报销附件",
        formUrl: "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123",
        successText: "请在影刀表单中提交"
      }
    ]
  });

  assert.equal(card.header.title.content, "可用影刀应用");
  assert.equal(card.header.template, "blue");
  assert.match(card.elements[0].text.content, /点击按钮后将跳转到影刀表单/);
  assert.match(card.elements[1].text.content, /\*\*报销表单\*\*/);
  assert.equal(card.elements[2].tag, "note");
  assert.match(card.elements[2].elements[0].content, /请在影刀表单中提交/);
  assert.equal(card.elements[3].actions[0].text.content, "打开影刀表单");
  assert.equal(
    card.elements[3].actions[0].multi_url.url,
    "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123"
  );
  assert.equal("value" in card.elements[3].actions[0], false);
});

defineTest("buildAppListCard 为多个应用插入分隔元素", () => {
  const card = buildAppListCard({
    apps: [
      {
        appCode: "expense_form",
        appName: "报销表单",
        description: "提交报销附件",
        formUrl: "https://console.yingdao.com/form/expense"
      },
      {
        appCode: "contract_form",
        appName: "合同申请",
        description: "发起合同审批",
        formUrl: "https://console.yingdao.com/form/contract"
      }
    ]
  });

  assert.equal(card.elements[4].tag, "hr");
  assert.match(card.elements[5].text.content, /\*\*合同申请\*\*/);
});

defineTest("buildAppListCard 在无应用时展示空状态", () => {
  const card = buildAppListCard({ apps: [] });

  assert.match(card.elements[1].text.content, /当前没有可触发的影刀应用/);
});
