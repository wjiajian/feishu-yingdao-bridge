import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { createFeishuHandler } from "../src/app/create-feishu-handler.js";

const appConfig = {
  appCode: "leave_sync",
  appName: "请假同步",
  description: "同步请假数据",
  enabled: true,
  webhookUrl: "https://example.com/webhook",
  formVersion: 2,
  metaPrefix: "_meta_",
  successText: "已提交",
  fields: [
    {
      fieldKey: "employee_no",
      fieldLabel: "工号",
      fieldType: "text",
      required: true,
      placeholder: "请输入工号",
      validationRegex: "^\\d{6}$",
      validationMessage: "工号必须为 6 位数字"
    }
  ],
  permissions: [
    {
      openId: "ou_123",
      enabled: true
    }
  ]
};

defineTest("菜单事件返回当前用户可用应用卡片", async () => {
  const sentCards = [];
  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return { apps: [appConfig] };
      }
    },
    feishuClient: {
      async sendCardMessage(payload) {
        sentCards.push(payload);
      }
    },
    yingdaoService: {
      async trigger() {
        throw new Error("不应触发");
      }
    },
    now: () => "2026-04-07T12:00:00+08:00",
    createRequestId: () => "req-ignored"
  });

  await handler.handleEvent({
    type: "menu_click",
    eventKey: "open_shadowbot_apps",
    operator: {
      openId: "ou_123"
    },
    message: {
      chatId: "oc_xxx"
    }
  });

  assert.equal(sentCards.length, 1);
  assert.equal(sentCards[0].chatId, "oc_xxx");
  assert.equal(sentCards[0].card.header.title.content, "可用影刀应用");
});

defineTest("非影刀菜单事件不会发送卡片", async () => {
  const sentCards = [];
  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return { apps: [appConfig] };
      }
    },
    feishuClient: {
      async sendCardMessage(payload) {
        sentCards.push(payload);
      }
    },
    yingdaoService: {
      async trigger() {
        throw new Error("不应触发");
      }
    },
    now: () => "2026-04-07T12:00:00+08:00",
    createRequestId: () => "req-ignored"
  });

  await handler.handleEvent({
    type: "menu_click",
    eventKey: "other_menu",
    operator: {
      openId: "ou_123"
    },
    message: {
      chatId: "oc_xxx"
    }
  });

  assert.equal(sentCards.length, 0);
});

defineTest("表单提交成功后调用影刀并返回成功卡片", async () => {
  const triggered = [];
  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return { apps: [appConfig] };
      }
    },
    feishuClient: {
      async sendCardMessage() {
        throw new Error("不应发送新消息");
      }
    },
    yingdaoService: {
      async trigger(payload) {
        triggered.push(payload);
      }
    },
    now: () => "2026-04-07T12:30:00+08:00",
    createRequestId: () => "req-001"
  });

  const result = await handler.handleCardAction({
    operator: {
      openId: "ou_123",
      name: "张三"
    },
    action: {
      name: "submit_app_form",
      value: {
        appCode: "leave_sync",
        formVersion: 2,
        employee_no: "123456"
      }
    }
  });

  assert.match(result.card.elements[0].text.content, /req-001/);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(triggered.length, 1);
  assert.equal(triggered[0].app.appCode, "leave_sync");
});

defineTest("表单提交不会等待影刀触发完成才返回", async () => {
  let resolveTrigger;
  let triggerStarted = false;

  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return { apps: [appConfig] };
      }
    },
    feishuClient: {
      async sendCardMessage() {
        throw new Error("不应发送新消息");
      }
    },
    yingdaoService: {
      async trigger() {
        triggerStarted = true;
        await new Promise((resolve) => {
          resolveTrigger = resolve;
        });
      }
    },
    now: () => "2026-04-07T12:30:00+08:00",
    createRequestId: () => "req-001"
  });

  const result = await handler.handleCardAction({
    operator: {
      openId: "ou_123",
      name: "张三"
    },
    action: {
      name: "submit_app_form:leave_sync:2",
      value: {
        employee_no: "123456"
      }
    }
  });

  assert.equal(triggerStarted, true);
  assert.match(result.toast.content, /已提交/);
  resolveTrigger();
});

defineTest("表单提交在字段校验失败时返回错误卡片", async () => {
  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return { apps: [appConfig] };
      }
    },
    feishuClient: {
      async sendCardMessage() {
        throw new Error("不应发送新消息");
      }
    },
    yingdaoService: {
      async trigger() {
        throw new Error("不应触发");
      }
    },
    now: () => "2026-04-07T12:30:00+08:00",
    createRequestId: () => "req-001"
  });

  const result = await handler.handleCardAction({
    operator: {
      openId: "ou_123",
      name: "张三"
    },
    action: {
      name: "submit_app_form",
      value: {
        appCode: "leave_sync",
        formVersion: 2,
        employee_no: "abc"
      }
    }
  });

  assert.match(result.toast.content, /工号必须为 6 位数字/);
});

defineTest("表单提交成功卡片中的提交时间按东八区显示", async () => {
  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return { apps: [appConfig] };
      }
    },
    feishuClient: {
      async sendCardMessage() {
        throw new Error("不应发送新消息");
      }
    },
    yingdaoService: {
      async trigger() {}
    },
    now: () => "2026-04-08T02:53:48.386Z",
    createRequestId: () => "req-002"
  });

  const result = await handler.handleCardAction({
    operator: {
      openId: "ou_123",
      name: "张三"
    },
    action: {
      name: "submit_app_form:leave_sync:2",
      value: {
        employee_no: "123456"
      }
    }
  });

  assert.match(result.card.elements[0].text.content, /2026-04-08 10:53:48/);
});

defineTest("取消表单会返回已取消结果卡片", async () => {
  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return { apps: [appConfig] };
      }
    },
    feishuClient: {
      async sendCardMessage() {
        throw new Error("不应发送新消息");
      }
    },
    yingdaoService: {
      async trigger() {
        throw new Error("不应触发");
      }
    },
    now: () => "2026-04-08T02:53:48.386Z",
    createRequestId: () => "req-003"
  });

  const result = await handler.handleCardAction({
    operator: {
      openId: "ou_123",
      name: "张三"
    },
    action: {
      name: "cancel_app_form",
      value: {
        appCode: "leave_sync"
      }
    }
  });

  assert.match(result.toast.content, /已取消/);
  assert.match(result.card.elements[0].text.content, /已取消/);
});
