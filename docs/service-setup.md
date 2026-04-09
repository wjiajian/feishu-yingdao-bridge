# 服务端实施手册

本文档只覆盖本仓库服务的部署、环境变量、回调联调和排错。

## 一、实施目标

服务端职责固定为：

1. 接收飞书菜单事件和卡片动作回调
2. 读取多维表格中的应用与权限配置
3. 按 `open_id` 判断用户可见应用
4. 生成应用列表卡片
5. 为每个应用提供跳转到影刀分享表单的按钮

服务端不再负责：

- 飞书卡片表单收集
- 表单字段校验
- 影刀 Webhook 转发

## 二、环境变量

部署前需要配置：

| 变量名 | 说明 |
|---|---|
| `PORT` | 服务监听端口 |
| `FEISHU_APP_ID` | 飞书应用 `App ID` |
| `FEISHU_APP_SECRET` | 飞书应用 `App Secret` |
| `FEISHU_VERIFICATION_TOKEN` | 飞书回调校验令牌 |
| `FEISHU_ENCRYPT_KEY` | 预留字段 |
| `FEISHU_API_BASE_URL` | 默认 `https://open.feishu.cn` |
| `BITABLE_APP_TOKEN` | 多维表格 `App Token` |
| `BITABLE_APPS_TABLE_ID` | `apps` 表 `table_id` |
| `BITABLE_PERMISSIONS_TABLE_ID` | `app_permissions` 表 `table_id` |

## 三、服务端流程

### 1. 飞书回调入口

统一入口：

- [server.js](/D:/Project/feishu-yingdao-bridge/src/server.js)

当前支持：

1. URL 校验
2. 菜单点击事件
3. 卡片动作兜底处理

### 2. 配置读取

服务端从两张表读取配置，并做 30 秒内存缓存：

- [bitable-config-service.js](/D:/Project/feishu-yingdao-bridge/src/services/bitable-config-service.js)

### 3. 配置解析

解析规则：

- 只读取启用状态记录
- `apps` 决定展示信息和跳转地址
- `app_permissions` 决定用户授权

### 4. 卡片构建

服务端只生成一种卡片：应用列表卡片。

实现位置：

- [card-builder.js](/D:/Project/feishu-yingdao-bridge/src/core/card-builder.js)

## 四、部署与联调

### 1. 本地自检

```bash
npm test
```

### 2. 启动服务

```bash
npm start
```

### 3. 健康检查

```bash
curl https://你的域名/healthz
```

预期返回：

```json
{"ok":true}
```

### 4. 联调步骤

1. 配置 `apps` 和 `app_permissions`
2. 用已授权用户点击“影刀应用”
3. 确认收到应用列表卡片
4. 点击“打开影刀表单”
5. 确认浏览器打开对应影刀分享表单

## 五、常见问题

### 1. 菜单有回调，但列表为空

重点检查：

- `apps.enabled` 是否为 `true`
- `app_permissions.feishu_open_id` 是否正确
- 当前用户是否仍在有效期内

### 2. 按钮没有跳转

重点检查：

- `apps.form_url` 是否是完整分享表单地址
- 飞书卡片是否已经刷新到最新版本

### 3. 配置修改后没有立刻生效

当前服务默认缓存 30 秒，等待缓存过期后再试，或重启服务。
