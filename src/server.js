import http from "node:http";

import {
  sanitizeFeishuCallbackBody,
  summarizeFeishuCallbackBody,
  summarizeMappedFeishuEvent
} from "./app/feishu-callback-log.js";
import { createFeishuHandler } from "./app/create-feishu-handler.js";
import { formatFeishuCallbackResponse } from "./app/feishu-callback-response.js";
import { mapFeishuEvent } from "./app/feishu-event-mapper.js";
import { createBitableClient } from "./adapters/bitable-client.js";
import { createFeishuClient } from "./adapters/feishu-client.js";
import { loadDotEnvFile } from "./config/dotenv.js";
import { loadEnv } from "./config/env.js";
import { verifyFeishuToken } from "./core/feishu-auth.js";
import { createLogger } from "./core/logger.js";
import { createYingdaoService } from "./core/yingdao-service.js";
import { createBitableConfigService } from "./services/bitable-config-service.js";

loadDotEnvFile();

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const rawBody = Buffer.concat(chunks).toString("utf8");
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(payload));
}

try {
  const env = loadEnv();
  const logger = createLogger({
    level: env.logLevel
  });
  const feishuClient = createFeishuClient({
    appId: env.feishu.appId,
    appSecret: env.feishu.appSecret,
    apiBaseUrl: env.feishu.apiBaseUrl
  });
  const bitableClient = createBitableClient({
    tokenProvider: feishuClient,
    apiBaseUrl: env.feishu.apiBaseUrl
  });
  const configService = createBitableConfigService({
    bitableClient,
    bitable: env.bitable
  });
  const yingdaoService = createYingdaoService({});
  const feishuHandler = createFeishuHandler({
    configService,
    feishuClient,
    yingdaoService,
    menuEventKey: env.feishu.menuEventKey,
    logger
  });

  const server = http.createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/healthz") {
      return writeJson(response, 200, { ok: true });
    }

    if (request.method === "POST" && request.url === "/api/feishu/callback") {
      let callbackSummary = {
        eventType: "",
        eventId: "",
        openId: "",
        eventKey: "",
        actionName: "",
        appCode: "",
        messageId: "",
        chatId: ""
      };

      try {
        const body = await readJsonBody(request);
        callbackSummary = summarizeFeishuCallbackBody(body);
        logger.info("feishu.callback.received", callbackSummary);
        logger.debug("feishu.callback.raw_body", {
          body: sanitizeFeishuCallbackBody(body)
        });
        const authResult = verifyFeishuToken({
          body,
          verificationToken: env.feishu.verificationToken
        });

        if (!authResult.ok) {
          logger.warn("feishu.callback.unauthorized", {
            ...callbackSummary,
            reason: authResult.reason
          });
          return writeJson(response, 401, {
            error: authResult.reason
          });
        }

        const event = mapFeishuEvent(body);
        logger.debug("feishu.callback.mapped", summarizeMappedFeishuEvent(event));

        if (event.kind === "url_verification") {
          logger.info("feishu.callback.url_verification", callbackSummary);
          return writeJson(response, 200, { challenge: event.challenge });
        }

        if (event.kind === "menu_click") {
          await feishuHandler.handleEvent(event.event);
          return writeJson(response, 200, { ok: true });
        }

        if (event.kind === "card_action") {
          const result = await feishuHandler.handleCardAction(event.payload);
          return writeJson(response, 200, formatFeishuCallbackResponse(result));
        }

        logger.warn("feishu.callback.unknown_event", callbackSummary);
        return writeJson(response, 400, { error: "无法识别的飞书回调" });
      } catch (error) {
        logger.error("feishu.callback.error", {
          ...callbackSummary,
          error: error instanceof Error ? error.message : String(error)
        });
        return writeJson(response, 500, {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }

    return writeJson(response, 404, { error: "Not Found" });
  });

  server.listen(env.port, () => {
    logger.info("server.started", {
      port: env.port
    });
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
