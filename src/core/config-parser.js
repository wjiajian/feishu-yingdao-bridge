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
      formUrl: toStringValue(fields.form_url),
      successText: toStringValue(fields.success_text, "请在影刀表单中提交"),
      permissions: []
    }))
    .filter((app) => app.appCode);

  const appMap = new Map(apps.map((app) => [app.appCode, app]));

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

  apps.sort((left, right) => left.displayOrder - right.displayOrder);

  return { apps };
}
