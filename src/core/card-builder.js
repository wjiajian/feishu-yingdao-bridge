function createMarkdownBlock(content) {
  return {
    tag: "div",
    text: {
      tag: "lark_md",
      content
    }
  };
}

function createTextInput(field, values = {}) {
  return {
    tag: "input",
    name: field.fieldKey,
    label: {
      tag: "plain_text",
      content: `${field.fieldLabel}${field.required ? " *" : ""}`
    },
    required: Boolean(field.required),
    placeholder: {
      tag: "plain_text",
      content: field.placeholder || `请输入${field.fieldLabel}`
    },
    default_value: values[field.fieldKey] ?? "",
    width: "fill"
  };
}

function createNumberInput(field, values = {}) {
  return {
    ...createTextInput(field, values),
    input_type: "number"
  };
}

function createDatePicker(field, values = {}) {
  return {
    tag: "date_picker",
    name: field.fieldKey,
    required: Boolean(field.required),
    placeholder: {
      tag: "plain_text",
      content: field.placeholder || `请选择${field.fieldLabel}`
    },
    value: values[field.fieldKey] ?? ""
  };
}

function createSelect(field, values = {}) {
  return {
    tag: "select_static",
    name: field.fieldKey,
    required: Boolean(field.required),
    placeholder: {
      tag: "plain_text",
      content: field.placeholder || `请选择${field.fieldLabel}`
    },
    options: (field.options ?? []).map((option) => ({
      text: {
        tag: "plain_text",
        content: option.label
      },
      value: option.value
    })),
    initial_option: values[field.fieldKey]
      ? {
          text: {
            tag: "plain_text",
            content:
              (field.options ?? []).find((option) => option.value === values[field.fieldKey])?.label ??
              values[field.fieldKey]
          },
          value: values[field.fieldKey]
        }
      : undefined
  };
}

function createFieldElement(field, values = {}) {
  switch (field.fieldType) {
    case "number":
      return createNumberInput(field, values);
    case "date":
    case "datetime":
      return createDatePicker(field, values);
    case "select":
      return createSelect(field, values);
    case "textarea":
      return {
        ...createTextInput(field, values),
        input_type: "multiline_text"
      };
    case "text":
    default:
      return createTextInput(field, values);
  }
}

export function buildAppListCard({ apps }) {
  const elements = [
    createMarkdownBlock("请选择要触发的影刀应用。")
  ];

  if (!apps?.length) {
    elements.push(createMarkdownBlock("当前没有可用应用。"));
  } else {
    for (const app of apps) {
      elements.push(
        {
          tag: "action",
          actions: [
            {
              tag: "button",
              text: {
                tag: "plain_text",
                content: app.appName
              },
              type: "primary",
              value: {
                action: "open_app_form",
                appCode: app.appCode
              }
            }
          ]
        },
        createMarkdownBlock(app.description || "无应用说明")
      );
    }
  }

  return {
    config: {
      update_multi: true
    },
    header: {
      title: {
        tag: "plain_text",
        content: "可用影刀应用"
      }
    },
    elements
  };
}

export function buildAppFormCard({ app, values = {}, errors = [] }) {
  const formElements = [];
  const elements = [createMarkdownBlock(app.description || "请填写表单后提交。")];

  if (errors.length > 0) {
    elements.push(createMarkdownBlock(`**校验失败**\n${errors.join("\n")}`));
  }

  for (const field of app.fields ?? []) {
    formElements.push(createFieldElement(field, values));
  }

  formElements.push({
    tag: "button",
    name: `submit_app_form:${app.appCode}:${app.formVersion}`,
    text: {
      tag: "plain_text",
      content: "提交"
    },
    type: "primary_filled",
    form_action_type: "submit",
    value: {
      action: "submit_app_form",
      appCode: app.appCode,
      formVersion: app.formVersion
    }
  });

  elements.push({
    tag: "form",
    name: `app_form:${app.appCode}`,
    elements: formElements
  });

  elements.push({
    tag: "action",
    actions: [
      {
        tag: "button",
        text: {
          tag: "plain_text",
          content: "取消"
        },
        value: {
          action: "cancel_app_form",
          appCode: app.appCode
        }
      }
    ]
  });

  return {
    config: {
      update_multi: false
    },
    header: {
      title: {
        tag: "plain_text",
        content: app.appName
      }
    },
    elements
  };
}

export function buildSubmitSuccessCard({ appName, requestId, submittedAt, successText }) {
  return {
    config: {
      update_multi: false
    },
    header: {
      title: {
        tag: "plain_text",
        content: appName
      }
    },
    elements: [
      createMarkdownBlock(`${successText || "已提交"}\n申请编号：${requestId}\n提交时间：${submittedAt}`)
    ]
  };
}
