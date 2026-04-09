import { parseBitableConfig } from "../core/config-parser.js";

export function createBitableConfigService({
  bitableClient,
  bitable,
  cacheTtlMs = 30_000,
  now = () => Date.now()
}) {
  let cachedConfig = null;
  let expiresAt = 0;

  return {
    async getConfig() {
      if (cachedConfig && now() < expiresAt) {
        return cachedConfig;
      }

      const [apps, permissions] = await Promise.all([
        bitableClient.listAllRecords({ appToken: bitable.appToken, tableId: bitable.appsTableId }),
        bitableClient.listAllRecords({ appToken: bitable.appToken, tableId: bitable.permissionsTableId })
      ]);

      cachedConfig = parseBitableConfig({
        apps,
        permissions
      });
      expiresAt = now() + cacheTtlMs;

      return cachedConfig;
    },

    clearCache() {
      cachedConfig = null;
      expiresAt = 0;
    }
  };
}
