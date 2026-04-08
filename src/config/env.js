function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`缺少环境变量 ${name}`);
  }

  return value;
}

export function loadEnv() {
  return {
    port: Number(process.env.PORT || 3000),
    logLevel: process.env.LOG_LEVEL || "info",
    feishu: {
      appId: required("FEISHU_APP_ID"),
      appSecret: required("FEISHU_APP_SECRET"),
      verificationToken: process.env.FEISHU_VERIFICATION_TOKEN || "",
      encryptKey: process.env.FEISHU_ENCRYPT_KEY || "",
      apiBaseUrl: process.env.FEISHU_API_BASE_URL || "https://open.feishu.cn",
      menuEventKey: process.env.FEISHU_MENU_EVENT_KEY || "open_shadowbot_apps"
    },
    bitable: {
      appToken: required("BITABLE_APP_TOKEN"),
      appsTableId: required("BITABLE_APPS_TABLE_ID"),
      fieldsTableId: required("BITABLE_FIELDS_TABLE_ID"),
      optionsTableId: required("BITABLE_OPTIONS_TABLE_ID"),
      permissionsTableId: required("BITABLE_PERMISSIONS_TABLE_ID")
    }
  };
}
