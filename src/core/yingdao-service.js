import crypto from "node:crypto";

export function buildYingdaoWebhookRequest({ app, user, requestId, submittedAt, values }) {
  const metaPrefix = app.metaPrefix || "_meta_";
  const body = {
    [`${metaPrefix}request_id`]: requestId,
    [`${metaPrefix}app_code`]: app.appCode,
    [`${metaPrefix}user_open_id`]: user.openId,
    [`${metaPrefix}user_name`]: user.name || "",
    [`${metaPrefix}submit_time`]: submittedAt,
    ...values
  };

  const headers = {
    "Content-Type": "application/json"
  };

  if (app.webhookSecret) {
    const timestamp = String(Date.now());
    const content = `${timestamp}.${JSON.stringify(body)}`;

    headers["X-Timestamp"] = timestamp;
    headers["X-Signature"] = crypto.createHmac("sha256", app.webhookSecret).update(content).digest("hex");
  }

  return {
    url: app.webhookUrl,
    method: app.webhookMethod || "POST",
    headers,
    body
  };
}

export function createYingdaoService({ fetchImpl = fetch }) {
  return {
    async trigger({ app, user, requestId, submittedAt, values }) {
      const request = buildYingdaoWebhookRequest({
        app,
        user,
        requestId,
        submittedAt,
        values
      });

      const response = await fetchImpl(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(request.body),
        signal: AbortSignal.timeout((app.timeoutSeconds || 10) * 1000)
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(`影刀 Webhook 调用失败: ${response.status} ${responseText}`);
      }

      return {
        status: response.status
      };
    }
  };
}
