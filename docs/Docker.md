# Docker 部署说明

本项目是原生 Node.js 服务，没有 `jar` 包，也不需要额外安装第三方依赖。容器直接运行 `node src/server.js`。

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
- `BITABLE_FIELDS_TABLE_ID`
- `BITABLE_OPTIONS_TABLE_ID`
- `BITABLE_PERMISSIONS_TABLE_ID`

`PORT` 默认是 `3000`，通常不需要改。

## 2. 使用 Docker Compose 启动

```bash
docker compose up -d --build
```

当前编排只定义一个服务：

- 服务名：`feishu-shadowbot`
- 构建文件：`Dockerfile`
- 端口映射：`3000:3000`
- 重启策略：`unless-stopped`
- 健康检查：`GET /healthz`

## 3. 可选：单独构建镜像

如果只想先构建镜像，可以执行：

```bash
docker compose build
```

## 4. 验证服务

健康检查地址：

```bash
curl http://127.0.0.1:3000/healthz
```

预期返回：

```json
{"ok":true}
```

飞书回调地址仍然是：

```text
https://你的域名/api/feishu/callback
```

## 5. 常用命令

查看日志：

```bash
docker compose logs -f
```

停止服务：

```bash
docker compose down
```

重启服务：

```bash
docker compose restart
```

查看容器状态：

```bash
docker compose ps
```
