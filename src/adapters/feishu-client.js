function buildHeaders(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=utf-8"
  };
}

export function createFeishuClient({
  appId,
  appSecret,
  fetchImpl = fetch,
  apiBaseUrl = "https://open.feishu.cn"
}) {
  let tokenCache = {
    value: "",
    expiresAt: 0
  };

  async function getTenantAccessToken() {
    if (tokenCache.value && Date.now() < tokenCache.expiresAt) {
      return tokenCache.value;
    }

    const response = await fetchImpl(`${apiBaseUrl}/open-apis/auth/v3/tenant_access_token/internal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8"
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret
      })
    });

    if (!response.ok) {
      throw new Error(`获取 tenant_access_token 失败: ${response.status} ${await response.text()}`);
    }

    const payload = await response.json();
    tokenCache = {
      value: payload.tenant_access_token,
      expiresAt: Date.now() + Math.max((payload.expire - 60) * 1000, 60_000)
    };

    return tokenCache.value;
  }

  return {
    async getTenantAccessToken() {
      return getTenantAccessToken();
    },

    async sendCardMessage({ chatId, openId, card }) {
      const receiveIdType = chatId ? "chat_id" : "open_id";
      const receiveId = chatId || openId;
      const accessToken = await getTenantAccessToken();
      const response = await fetchImpl(`${apiBaseUrl}/open-apis/im/v1/messages?receive_id_type=${receiveIdType}`, {
        method: "POST",
        headers: buildHeaders(accessToken),
        body: JSON.stringify({
          receive_id: receiveId,
          msg_type: "interactive",
          content: JSON.stringify(card)
        })
      });

      if (!response.ok) {
        throw new Error(`发送飞书卡片失败: ${response.status} ${await response.text()}`);
      }

      return response.json();
    }
  };
}
