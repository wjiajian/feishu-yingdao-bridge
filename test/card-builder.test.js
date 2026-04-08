import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import {
  buildAppListCard,
  buildAppFormCard,
  buildCancelResultCard,
  buildSubmitSuccessCard
} from "../src/core/card-builder.js";

defineTest("buildAppListCard 生成应用列表按钮卡片", () => {
  const card = buildAppListCard({
    apps: [
      {
        appCode: "leave_sync",
        appName: "请假同步",
        description: "同步请假数据"
      }
    ]
  });

  assert.equal(card.header.title.content, "可用影刀应用");
  assert.equal(card.header.template, "blue");
  assert.match(card.elements[0].text.content, /卡片内直接填写/);
  assert.match(card.elements[1].text.content, /\*\*请假同步\*\*/);
  assert.equal(card.elements[2].tag, "note");
  assert.match(card.elements[2].elements[0].content, /卡片内填写参数/);
  assert.equal(card.elements[3].actions[0].value.appCode, "leave_sync");
  assert.equal(card.elements[3].actions[0].text.content, "打开表单");
  assert.equal(card.elements[3].actions[0].type, "primary_filled");
});

defineTest("buildAppListCard 为多个应用插入分隔元素", () => {
  const card = buildAppListCard({
    apps: [
      {
        appCode: "leave_sync",
        appName: "请假同步",
        description: "同步请假数据"
      },
      {
        appCode: "expense_sync",
        appName: "报销同步",
        description: "同步报销数据"
      }
    ]
  });

  assert.equal(card.elements[4].tag, "hr");
  assert.match(card.elements[5].text.content, /\*\*报销同步\*\*/);
});

defineTest("buildAppFormCard 生成带字段的表单卡片", () => {
  const card = buildAppFormCard({
    app: {
      appCode: "leave_sync",
      appName: "请假同步",
      description: "同步请假数据",
      formVersion: 3,
      fields: [
        {
          fieldKey: "employee_no",
          fieldLabel: "工号",
          fieldType: "text",
          required: true,
          placeholder: "请输入工号"
        }
      ]
    }
  });

  assert.equal(card.header.title.content, "请假同步");
  assert.equal(card.elements[1].tag, "form");
  assert.equal(card.elements[1].elements[0].tag, "input");
  assert.equal(card.elements[1].elements.at(-1).form_action_type, "submit");
  assert.equal(card.elements[1].elements.at(-1).name, "submit_app_form:leave_sync:3");
});

defineTest("buildSubmitSuccessCard 展示申请编号和时间", () => {
  const card = buildSubmitSuccessCard({
    appName: "请假同步",
    requestId: "req-001",
    submittedAt: "2026-04-07 12:30:00",
    successText: "已提交"
  });

  assert.match(card.elements[0].text.content, /req-001/);
  assert.match(card.elements[0].text.content, /2026-04-07 12:30:00/);
});

defineTest("buildCancelResultCard 展示取消结果", () => {
  const card = buildCancelResultCard({
    appName: "请假同步"
  });

  assert.equal(card.header.title.content, "请假同步");
  assert.match(card.elements[0].text.content, /已取消/);
});
