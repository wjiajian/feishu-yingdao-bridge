import assert from "node:assert/strict";

import { defineTest } from "./test-harness.js";
import { createFeishuHandler } from "../src/app/create-feishu-handler.js";

const appConfig = {
  appCode: "expense_form",
  appName: "报销表单",
  description: "提交报销附件",
  enabled: true,
  formUrl: "https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123",
  successText: "请在影刀表单中提交",
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
    now: () => "2026-04-07T12:00:00+08:00",
    createRequestId: () => "req-ignored"
  });

  await handler.handleEvent({
    type: "menu_click",
    eventId: "evt_1",
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
  assert.equal(sentCards[0].card.elements[3].actions[0].text.content, "打开影刀表单");
});

defineTest("菜单事件会过滤掉当前用户无权限的应用", async () => {
  const sentCards = [];
  const handler = createFeishuHandler({
    configService: {
      async getConfig() {
        return {
          apps: [
            appConfig,
            {
              ...appConfig,
              appCode: "contract_form",
              appName: "合同申请",
              permissions: [
                {
                  openId: "ou_other",
                  enabled: true
                }
              ]
            }
          ]
        };
      }
    },
    feishuClient: {
      async sendCardMessage(payload) {
        sentCards.push(payload);
      }
    },
    now: () => "2026-04-07T12:00:00+08:00"
  });

  await handler.handleEvent({
    type: "menu_click",
    eventId: "evt_perm_1",
    eventKey: "open_shadowbot_apps",
    operator: {
      openId: "ou_123"
    },
    message: {
      chatId: "oc_xxx"
    }
  });

  assert.equal(sentCards.length, 1);
  assert.match(sentCards[0].card.elements[1].text.content, /\*\*报销表单\*\*/);
  assert.equal(
    sentCards[0].card.elements.some(
      (element) => element.text?.content && /合同申请/.test(element.text.content)
    ),
    false
  );
});

defineTest("同一菜单事件重复投递时只发送一次卡片", async () => {
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
    now: () => "2026-04-07T12:00:00+08:00",
    createRequestId: () => "req-ignored"
  });

  const event = {
    type: "menu_click",
    eventId: "evt_1",
    eventKey: "open_shadowbot_apps",
    operator: {
      openId: "ou_123"
    },
    message: {
      chatId: "oc_xxx"
    }
  };

  await handler.handleEvent(event);
  await handler.handleEvent(event);

  assert.equal(sentCards.length, 1);
});

defineTest("超过时效的旧菜单事件不会再次发送卡片", async () => {
  const sentCards = [];
  const logs = [];
  const logger = {
    info(event, fields) {
      logs.push({ level: "info", event, fields });
    },
    warn(event, fields) {
      logs.push({ level: "warn", event, fields });
    },
    error(event, fields) {
      logs.push({ level: "error", event, fields });
    }
  };
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
    now: () => "2026-04-08T14:25:32+08:00",
    logger
  });

  await handler.handleEvent({
    type: "menu_click",
    eventId: "evt_old_1",
    createTime: "1775625606000",
    eventKey: "open_shadowbot_apps",
    operator: {
      openId: "ou_123"
    },
    message: {
      chatId: ""
    }
  });

  assert.equal(sentCards.length, 0);
  assert.ok(logs.some((item) => item.event === "feishu.menu.stale_ignored" && item.fields.eventId === "evt_old_1"));
});

defineTest("历史表单动作会进入不支持分支", async () => {
  const logs = [];
  const logger = {
    info(event, fields) {
      logs.push({ level: "info", event, fields });
    },
    warn(event, fields) {
      logs.push({ level: "warn", event, fields });
    },
    error(event, fields) {
      logs.push({ level: "error", event, fields });
    }
  };
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
    now: () => "2026-04-08T02:53:48.386Z",
    logger
  });

  const result = await handler.handleCardAction({
    operator: {
      openId: "ou_123",
      name: "张三"
    },
    action: {
      name: "submit_app_form",
      value: {
        appCode: "expense_form"
      }
    }
  });

  assert.match(result.toast.content, /不支持的动作类型/);
  assert.ok(
    logs.some(
      (item) =>
        item.event === "feishu.card.unsupported_action" &&
        item.fields.appCode === "expense_form"
    )
  );
});

defineTest("卡片动作在应用不存在时返回错误提示", async () => {
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
    now: () => "2026-04-08T02:53:48.386Z"
  });

  const result = await handler.handleCardAction({
    operator: {
      openId: "ou_123",
      name: "张三"
    },
    action: {
      name: "submit_app_form",
      value: {
        appCode: "missing_app"
      }
    }
  });

  assert.match(result.toast.content, /未找到对应应用/);
});
