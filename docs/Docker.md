# Docker 部署说明

本项目是原生 Node.js 服务，容器里直接运行 `node src/server.js`。

## 1. 准备环境变量

先复制 `.env.example` 为 `.env`，再填入真实配置。`compose.yaml` 会自动读取这个文件。

```bash
cp .env.example .env
```

必须配置的变量包括：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `BITABLE_APP_TOKEN`
- `BITABLE_APPS_TABLE_ID`
- `BITABLE_PERMISSIONS_TABLE_ID`

`PORT` 默认是 `3000`，通常不需要改。

## 2. 使用 Docker Compose 启动

```bash
docker compose up -d --build
```

## 3. 验证服务

健康检查地址：

```bash
curl http://127.0.0.1:3000/healthz
```

预期返回：

```json
{"ok":true}
```

飞书回调地址：

```text
https://你的域名/api/feishu/callback
```
