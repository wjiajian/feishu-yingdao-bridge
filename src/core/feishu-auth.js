export function verifyFeishuToken({ body, verificationToken }) {
  if (!verificationToken) {
    return {
      ok: true
    };
  }

  if (body?.action && !body?.header?.token) {
    return {
      ok: true
    };
  }

  const token = body?.header?.token || body?.token || "";

  if (token !== verificationToken) {
    return {
      ok: false,
      reason: "飞书回调 token 校验失败"
    };
  }

  return {
    ok: true
  };
}
