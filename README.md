# Feishu-Yingdao-Bridge

这个服务负责两件事：

1. 接收飞书菜单事件
2. 按用户权限返回可用影刀应用卡片，点击后直接跳转到对应影刀分享表单

当前实现不再支持飞书卡片内填写参数，也不再支持服务端转发影刀 Webhook。

## 文档

- [实施文档总览](./docs/README.md)
- [飞书端实施手册](./docs/feishu-setup.md)
- [影刀端实施手册](./docs/yingdao-setup.md)
- [服务端实施手册](./docs/service-setup.md)
- [多维表格模板与字段说明](./docs/bitable-template.md)
- [Docker 部署说明](./docs/Docker.md)

## 启动

1. 复制 `.env.example` 为 `.env`
2. 填写飞书和多维表格配置
3. 执行 `npm start`

## 回调接口

- `POST /api/feishu/callback`
- `GET /healthz`

## 多维表格

当前只需要两张表：

- `apps`
- `app_permissions`

字段模板见 [docs/bitable-template.md](/D:/Project/feishu-yingdao-bridge/docs/bitable-template.md)。

## 已知联调点

### 1. 浏览器直接打开 `/api/feishu/callback` 会返回 `Not Found`

这是正常现象。该地址只接受 `POST`。

### 2. 菜单点击后没有日志

优先检查飞书后台是否已经开启事件订阅，并把回调地址配置成：

`https://你的公网域名/api/feishu/callback`

### 3. 菜单有返回，但应用列表为空

优先检查：

- `apps.enabled` 是否为 `true`
- `app_permissions.feishu_open_id` 是否填写真实 `open_id`
- 当前用户是否确实在授权范围内

### 4. 点击按钮后没有跳转到影刀表单

优先检查：

- `apps.form_url` 是否填写完整
- 飞书卡片是否已经刷新到最新版本
- 影刀分享表单链接本身是否可访问
