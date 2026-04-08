function buildRecordsUrl(apiBaseUrl, appToken, tableId, pageToken) {
  const url = new URL(`${apiBaseUrl}/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`);
  url.searchParams.set("page_size", "500");

  if (pageToken) {
    url.searchParams.set("page_token", pageToken);
  }

  return url;
}

export function createBitableClient({ fetchImpl = fetch, tokenProvider, apiBaseUrl = "https://open.feishu.cn" }) {
  return {
    async listAllRecords({ appToken, tableId }) {
      const items = [];
      let pageToken = "";

      while (true) {
        const accessToken = await tokenProvider.getTenantAccessToken();
        const response = await fetchImpl(buildRecordsUrl(apiBaseUrl, appToken, tableId, pageToken), {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`读取多维表格失败: ${response.status} ${await response.text()}`);
        }

        const payload = await response.json();
        items.push(...(payload.data?.items ?? []));

        if (!payload.data?.has_more) {
          break;
        }

        pageToken = payload.data.page_token;
      }

      return items;
    }
  };
}
