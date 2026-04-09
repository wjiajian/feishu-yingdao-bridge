function createMarkdownBlock(content) {
  return {
    tag: "div",
    text: {
      tag: "lark_md",
      content
    }
  };
}

function createPlainTextBlock(content) {
  return {
    tag: "plain_text",
    content
  };
}

function createAppListSummary(app) {
  return createMarkdownBlock(`**${app.appName}**\n${app.description || "暂无应用说明"}`);
}

function createAppListNote(app) {
  return {
    tag: "note",
    elements: [
      createPlainTextBlock(app.successText || "请在影刀表单中提交")
    ]
  };
}

function createAppListAction(app) {
  return {
    tag: "action",
    actions: [
      {
        tag: "button",
        text: {
          tag: "plain_text",
          content: "打开影刀表单"
        },
        type: "primary_filled",
        multi_url: {
          url: app.formUrl
        }
      }
    ]
  };
}

export function buildAppListCard({ apps }) {
  const elements = [
    createMarkdownBlock("请选择要触发的影刀应用。点击按钮后将跳转到影刀表单。")
  ];

  if (!apps?.length) {
    elements.push(createMarkdownBlock("当前没有可触发的影刀应用。"));
  } else {
    apps.forEach((app, index) => {
      elements.push(createAppListSummary(app));
      elements.push(createAppListNote(app));
      elements.push(createAppListAction(app));

      if (index < apps.length - 1) {
        elements.push({
          tag: "hr"
        });
      }
    });
  }

  return {
    config: {
      update_multi: true
    },
    header: {
      template: "blue",
      title: {
        tag: "plain_text",
        content: "可用影刀应用"
      }
    },
    elements
  };
}
