function toBoolean(value, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (typeof value === "string") {
    return ["true", "1", "yes", "enabled"].includes(value.trim().toLowerCase());
  }

  return defaultValue;
}

function toNumber(value, defaultValue = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : defaultValue;
}

function normalizeScalarValue(value) {
  if (value === undefined || value === null) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeScalarValue(item);
      if (normalized !== undefined && normalized !== null && normalized !== "") {
        return normalized;
      }
    }

    return "";
  }

  if (typeof value === "object") {
    for (const key of ["link", "url", "text", "name", "value"]) {
      if (key in value) {
        const normalized = normalizeScalarValue(value[key]);
        if (normalized !== undefined && normalized !== null && normalized !== "") {
          return normalized;
        }
      }
    }
  }

  return value;
}

function toStringValue(value, defaultValue = "") {
  const normalized = normalizeScalarValue(value);

  if (normalized === undefined || normalized === null) {
    return defaultValue;
  }

  return String(normalized);
}

function compareBySortOrder(left, right) {
  return left.sortOrder - right.sortOrder;
}

export function parseBitableConfig(records) {
  const apps = (records.apps ?? [])
    .map((record) => record.fields ?? {})
    .filter((fields) => toBoolean(fields.enabled, true))
    .map((fields) => ({
      appCode: toStringValue(fields.app_code),
      appName: toStringValue(fields.app_name),
      enabled: toBoolean(fields.enabled, true),
      displayOrder: toNumber(fields.display_order, 0),
      description: toStringValue(fields.description),
      webhookUrl: toStringValue(fields.webhook_url),
      webhookMethod: toStringValue(fields.webhook_method, "POST").toUpperCase(),
      timeoutSeconds: toNumber(fields.timeout_seconds, 10),
      successText: toStringValue(fields.success_text, "已提交"),
      metaPrefix: toStringValue(fields.payload_meta_prefix, "_meta_"),
      formVersion: toNumber(fields.form_version, 1),
      fields: [],
      permissions: []
    }))
    .filter((app) => app.appCode);

  const appMap = new Map(apps.map((app) => [app.appCode, app]));
  const optionMap = new Map();

  for (const record of records.options ?? []) {
    const fields = record.fields ?? {};
    if (!toBoolean(fields.enabled, true)) {
      continue;
    }

    const appCode = toStringValue(fields.app_code);
    const fieldKey = toStringValue(fields.field_key);
    const compoundKey = `${appCode}:${fieldKey}`;
    const list = optionMap.get(compoundKey) ?? [];

    list.push({
      label: toStringValue(fields.option_label),
      value: toStringValue(fields.option_value),
      sortOrder: toNumber(fields.sort_order, 0)
    });

    optionMap.set(compoundKey, list);
  }

  for (const record of records.fields ?? []) {
    const fields = record.fields ?? {};
    if (!toBoolean(fields.enabled, true)) {
      continue;
    }

    const appCode = toStringValue(fields.app_code);
    const app = appMap.get(appCode);
    if (!app) {
      continue;
    }

    const fieldKey = toStringValue(fields.field_key);
    if (app.fields.some((item) => item.fieldKey === fieldKey)) {
      throw new Error(`应用 ${appCode} 的 field_key 重复: ${fieldKey}`);
    }

    const options = optionMap.get(`${appCode}:${fieldKey}`) ?? [];

    app.fields.push({
      fieldKey,
      fieldLabel: toStringValue(fields.field_label),
      fieldType: toStringValue(fields.field_type, "text"),
      required: toBoolean(fields.required, false),
      placeholder: toStringValue(fields.placeholder),
      defaultType: toStringValue(fields.default_type, "none"),
      defaultValue: fields.default_value ?? "",
      validationRegex: toStringValue(fields.validation_regex),
      validationMessage: toStringValue(fields.validation_message),
      sortOrder: toNumber(fields.sort_order, 0),
      options: options.sort(compareBySortOrder)
    });
  }

  for (const record of records.permissions ?? []) {
    const fields = record.fields ?? {};
    if (!toBoolean(fields.enabled, true)) {
      continue;
    }

    const app = appMap.get(toStringValue(fields.app_code));
    if (!app) {
      continue;
    }

    app.permissions.push({
      openId: toStringValue(fields.feishu_open_id),
      enabled: toBoolean(fields.enabled, true),
      validFrom: toStringValue(fields.valid_from),
      validTo: toStringValue(fields.valid_to),
      remark: toStringValue(fields.remark)
    });
  }

  for (const app of apps) {
    app.fields.sort(compareBySortOrder);
  }

  apps.sort((left, right) => left.displayOrder - right.displayOrder);

  return { apps };
}
