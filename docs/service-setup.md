# 服务端实施手册

本文档只覆盖本仓库服务的部署、环境变量、回调联调和排错，不包含飞书后台和影刀后台具体配置。

## 一、实施目标

服务端负责把飞书与影刀串起来，职责固定为：

1. 接收飞书菜单事件和卡片交互回调
2. 读取多维表格中的应用、字段、选项、权限配置
3. 按 `open_id` 判断用户可见应用
4. 动态生成飞书应用列表卡片和表单卡片
5. 校验表单参数
6. 转发到影刀高级任务计划 Webhook
7. 返回成功卡片或错误提示

核心入口见：

- [src/server.js](/D:/Project/feishu-shadowbot/src/server.js#L1)

## 二、运行环境

当前实现基于 Node.js 原生能力，不依赖第三方包管理运行时扩展。

建议环境：

- Node.js 20 及以上
- 可访问飞书开放平台与影刀控制台相关域名
- 一个公网 HTTPS 域名

## 三、部署前准备

### 1. 准备环境变量

复制 [.env.example](/D:/Project/feishu-shadowbot/.env.example#L1) 中的变量，并在部署平台中配置：

| 变量名 | 说明 |
|---|---|
| `PORT` | 服务监听端口 |
| `FEISHU_APP_ID` | 飞书应用 `App ID` |
| `FEISHU_APP_SECRET` | 飞书应用 `App Secret` |
| `FEISHU_VERIFICATION_TOKEN` | 飞书回调校验令牌 |
| `FEISHU_ENCRYPT_KEY` | 预留字段，当前版本未使用 |
| `FEISHU_API_BASE_URL` | 默认 `https://open.feishu.cn` |
| `BITABLE_APP_TOKEN` | 多维表格 `App Token` |
| `BITABLE_APPS_TABLE_ID` | `apps` 表 `table_id` |
| `BITABLE_FIELDS_TABLE_ID` | `app_fields` 表 `table_id` |
| `BITABLE_OPTIONS_TABLE_ID` | `field_options` 表 `table_id` |
| `BITABLE_PERMISSIONS_TABLE_ID` | `app_permissions` 表 `table_id` |

环境变量读取逻辑见：

- [src/config/env.js](/D:/Project/feishu-shadowbot/src/config/env.js#L1)

### 2. 准备公网回调地址

飞书回调地址固定使用：

`https://你的域名/api/feishu/callback`

健康检查地址：

`https://你的域名/healthz`

## 四、启动服务

本项目没有外部依赖安装步骤，直接执行：

```bash
npm start
```

启动成功后，控制台会输出监听端口。实现位置：

- [src/server.js](/D:/Project/feishu-shadowbot/src/server.js#L154)

## 五、服务端内部流程

### 1. 飞书回调入口

所有飞书请求都进入：

- [src/server.js](/D:/Project/feishu-shadowbot/src/server.js#L113)

当前支持三类请求：

1. URL 校验
2. 菜单点击事件
3. 卡片动作与表单提交

### 2. 飞书回调令牌校验

服务端会优先做 `Verification Token` 校验：

- [src/core/feishu-auth.js](/D:/Project/feishu-shadowbot/src/core/feishu-auth.js#L1)

如果飞书后台与服务端的 `FEISHU_VERIFICATION_TOKEN` 不一致，请求会被直接拒绝。

### 3. 多维表格配置读取

服务端从 4 张表读取配置，并做 30 秒内存缓存：

- [src/services/bitable-config-service.js](/D:/Project/feishu-shadowbot/src/services/bitable-config-service.js#L3)

读取接口使用飞书开放平台多维表格记录查询接口：

- https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list

### 4. 配置解析

服务端会把多维表格记录解析为应用配置对象：

- [src/core/config-parser.js](/D:/Project/feishu-shadowbot/src/core/config-parser.js#L34)

解析规则：

- 只读取启用状态记录
- `apps` 决定应用元信息
- `app_fields` 决定表单字段
- `field_options` 决定下拉选项
- `app_permissions` 决定用户授权
- 同一应用下 `field_key` 重复会直接抛错

### 5. 权限校验

当前权限实现是按飞书 `open_id` 直配，并支持有效期：

- [src/core/permission-service.js](/D:/Project/feishu-shadowbot/src/core/permission-service.js#L1)

### 6. 卡片构建

服务端动态生成三种卡片：

1. 应用列表卡片
2. 应用表单卡片
3. 提交成功卡片

实现位置：

- [src/core/card-builder.js](/D:/Project/feishu-shadowbot/src/core/card-builder.js#L95)

### 7. 提交影刀 Webhook

服务端会把业务字段与元信息合并成扁平 JSON，再发到影刀：

- [src/core/yingdao-service.js](/D:/Project/feishu-shadowbot/src/core/yingdao-service.js#L3)

请求体结构如下：

```json
{
  "_meta_request_id": "uuid",
  "_meta_app_code": "leave_sync",
  "_meta_user_open_id": "ou_xxx",
  "_meta_user_name": "张三",
  "_meta_submit_time": "2026-04-07T10:20:30+08:00",
  "employee_no": "123456",
  "reason": "事假"
}
```

## 六、部署步骤

### 1. 本地自检

在正式部署前先跑一次：

```bash
npm test
```

当前仓库测试覆盖了：

- 多维表格配置解析
- 权限判断
- 卡片生成
- 影刀负载构造
- 飞书 Token 校验
- 飞书菜单与表单处理流程

### 2. 部署到目标环境

你可以部署到任意支持 Node.js 的服务环境，只要满足公网 HTTPS 回调要求。

部署动作保持不变：

1. 上传代码
2. 配置环境变量
3. 启动 `npm start`
4. 打开 `/healthz` 检查是否返回 `{"ok":true}`

### 3. 回填飞书回调地址

服务端上线后，把实际公网地址回填到飞书后台：

- 菜单点击回调
- 交互卡片回调
- 事件订阅地址

统一填写：

`https://你的域名/api/feishu/callback`

## 七、完整联调步骤

### 第一步：验证健康检查

浏览器或命令行访问：

```bash
curl https://你的域名/healthz
```

预期返回：

```json
{"ok":true}
```

### 第二步：验证飞书 URL 校验

在飞书后台保存回调地址，确认服务端能返回 `challenge`。

### 第三步：验证多维表格读取

先配置 1 个应用、1 个字段、1 个授权用户。

### 第四步：验证菜单点击

用已授权用户点击“影刀应用”，看是否能收到应用列表卡片。

### 第五步：验证表单提交

在表单中填写一组合法参数并提交，检查：

- 飞书卡片是否返回成功提示
- 影刀高级任务计划是否收到请求
- 影刀应用是否拿到参数

### 第六步：验证权限隔离

改用未授权用户点击同一个菜单按钮，预期只能看到空状态或被拒绝。

## 八、服务端常见问题

### 1. `/healthz` 正常，但飞书回调失败

重点检查：

- `FEISHU_VERIFICATION_TOKEN` 是否正确
- 飞书回调地址是否使用 HTTPS
- 飞书侧是否能访问当前公网地址

### 2. 菜单能收到卡片，但应用列表为空

重点检查：

- `apps.enabled` 是否开启
- `app_permissions.feishu_open_id` 是否正确
- 是否误把 `open_id` 写成别的标识

### 3. 能打开表单，但提交时报字段错误

重点检查：

- `app_fields.required` 配置是否正确
- `validation_regex` 是否合法
- `form_version` 是否在改表单后同步递增

### 4. 飞书提交成功，但影刀没执行

重点检查：

- `apps.webhook_url` 是否是最新发布的 Webhook 地址
- 影刀高级任务计划是否已发布
- 服务端日志里是否有 `影刀 Webhook 调用失败`

### 5. 改了多维表格配置后没有立刻生效

当前服务默认缓存 30 秒，等待缓存过期后再试，或重启服务。

## 九、上线前检查清单

上线前至少核对一次：

- 飞书应用凭据已配置
- 回调地址已发布
- 多维表格四张表已建好
- 至少一个应用已写入 `apps`
- 每个应用至少有一个字段
- 至少一个测试用户已授权
- 影刀高级任务计划已发布
- `npm test` 已通过

## 十、参考资料

- 飞书 `tenant_access_token`  
  https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal
- 飞书发送消息  
  https://open.feishu.cn/document/server-docs/im-v1/message/create
- 飞书多维表格读取记录  
  https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list
- 飞书新版消息卡片交互录入示例  
  https://open.feishu.cn/community/articles/7319786721459863556?lang=zh-CN
- 影刀高级任务计划入门  
  https://www.yingdao.com/community/detaildiscuss?id=838730599324614656
- 影刀通过 Webhook 接收参数示例  
  https://www.yingdao.com/community/detaildiscuss?id=928930038031667200
