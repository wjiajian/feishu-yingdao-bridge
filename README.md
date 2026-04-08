# Feishu-Shadowbot-Bridge

飞书应用机器人通过菜单按钮返回影刀应用卡片，用户在卡片内填写表单并提交，后端根据多维表格配置校验权限后触发影刀高级计划 Webhook。

## 文档

- [实施文档总览](./docs/README.md)
- [飞书端实施手册](./docs/feishu-setup.md)
- [影刀端实施手册](./docs/yingdao-setup.md)
- [服务端实施手册](./docs/service-setup.md)

## 启动

1. 复制 `.env.example` 为 `.env`，并填入飞书与多维表格配置。
2. 执行 `npm start`。服务会自动读取项目根目录下的 `.env` 文件。

## 回调接口

- `POST /api/feishu/callback`
- `GET /healthz`

## 多维表格表结构

需要 4 张表：

- `apps`
- `app_fields`
- `field_options`
- `app_permissions`

字段含义按照设计方案中的定义填写。

## 联调踩坑记录

### 1. `.env` 写了但 `npm start` 仍提示缺少环境变量

原因：

- 早期版本只读 `process.env`，不会自动加载项目根目录 `.env`

当前行为：

- 服务启动时会自动读取项目根目录 `.env`

要求：

- `.env` 必须放在仓库根目录
- 变量名必须与 `.env.example` 一致

### 2. 浏览器打开 `/api/feishu/callback` 返回 `{"error":"Not Found"}`

原因：

- `/api/feishu/callback` 只接受 `POST`
- 浏览器直接打开会发 `GET`

结论：

- 这是正常现象，不代表回调地址失效
- 浏览器只用来测 `/healthz`

### 3. 飞书菜单点击后直接打开浏览器

原因：

- 机器人菜单被配置成了“打开链接”

正确配置：

- 菜单动作必须选“推送事件”或“回调事件”
- 菜单事件 ID 使用 `open_shadowbot_apps`

### 4. 菜单点击后服务端没有任何日志

原因：

- 飞书后台只配了菜单按钮，没有配“事件订阅”

正确配置：

- 开启事件订阅
- 回调地址填 `https://你的公网域名/api/feishu/callback`
- 勾选机器人菜单事件
- 发布应用最新版本

### 5. 本地穿透地址能创建，但回调不通

表现：

- `cloudflared` 报本地 `3000` 端口拒绝连接
- 或 `quic` 超时

正确做法：

- 本地服务先启动成功
- 先验证 `http://127.0.0.1:3000/healthz`
- 再启动穿透：

```powershell
cloudflared tunnel --protocol http2 --url http://127.0.0.1:3000
```

注意：

- 不要用 `localhost`，优先用 `127.0.0.1`
- `trycloudflare.com` 是临时地址，每次重启可能变化
- 地址一变，飞书后台回调地址也要同步更新

### 6. 菜单事件到了，但应用列表为空

原因：

- 当前权限按飞书 `open_id` 直配

正确做法：

- 从回调日志里复制真实 `open_id`
- 写入 `app_permissions.feishu_open_id`
- 不要写姓名、邮箱、手机号

### 7. 点击应用按钮报 `200671` 或 `200672`

已踩到的两个原因：

- `card.action.trigger` 回调结构未按新版格式解析
- 新版卡片回调响应体没有按 `card.type=raw` 包装

当前处理：

- 服务端已兼容新版 `card.action.trigger`
- 卡片回调响应已按新版格式返回

### 8. 表单卡片能打开，但没有输入框

原因：

- 新版飞书卡片里的输入组件不能直接裸放在 `elements` 中

正确做法：

- 输入字段必须放在 `form` 容器内
- 提交按钮使用表单提交动作

### 9. 提交表单后影刀没执行，日志报 `Failed to parse URL from [object Object]`

原因：

- 多维表格里的 `webhook_url` 被飞书返回成对象
- 旧代码直接把对象转成字符串，结果变成了 `[object Object]`

当前处理：

- 服务端会优先从对象字段里的 `link`、`url`、`text`、`name`、`value` 提取实际字符串

### 10. 提交表单后飞书报错，但影刀触发很慢

原因：

- 早期实现会在飞书卡片回调线程里同步等待影刀 Webhook 完成

当前处理：

- 服务端会先立即返回飞书成功卡片
- 影刀触发改为后台异步执行
- 影刀失败信息会打印到终端日志
