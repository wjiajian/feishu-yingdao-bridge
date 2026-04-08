function isInValidityWindow(permission, now) {
  const nowValue = new Date(now).getTime();

  if (permission.validFrom) {
    const validFrom = new Date(permission.validFrom).getTime();
    if (Number.isFinite(validFrom) && nowValue < validFrom) {
      return false;
    }
  }

  if (permission.validTo) {
    const validTo = new Date(permission.validTo).getTime();
    if (Number.isFinite(validTo) && nowValue > validTo) {
      return false;
    }
  }

  return true;
}

export function checkAppPermission({ app, openId, now }) {
  if (!app?.enabled) {
    return {
      allowed: false,
      reason: "应用未启用"
    };
  }

  const matched = (app.permissions ?? []).find((permission) => {
    return permission.enabled !== false && permission.openId === openId && isInValidityWindow(permission, now);
  });

  if (!matched) {
    return {
      allowed: false,
      reason: "当前用户无权限使用该应用"
    };
  }

  return {
    allowed: true
  };
}

export function filterAuthorizedApps({ apps, openId, now }) {
  return (apps ?? []).filter((app) => checkAppPermission({ app, openId, now }).allowed);
}
