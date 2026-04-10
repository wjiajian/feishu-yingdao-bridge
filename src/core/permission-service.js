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

export function checkAppPermission({ app, openId, departmentIds = [], now }) {
  if (!app?.enabled) {
    return {
      allowed: false,
      reason: "应用未启用"
    };
  }

  const departmentIdSet = new Set(departmentIds.filter(Boolean));
  const matched = (app.permissions ?? []).find((permission) => {
    if (permission.enabled === false || !isInValidityWindow(permission, now)) {
      return false;
    }

    if (permission.openId && permission.openId === openId) {
      return true;
    }

    return Boolean(permission.departmentId) && departmentIdSet.has(permission.departmentId);
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

export function filterAuthorizedApps({ apps, openId, departmentIds = [], now }) {
  return (apps ?? []).filter((app) => checkAppPermission({ app, openId, departmentIds, now }).allowed);
}
