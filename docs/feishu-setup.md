# 飞书端实施手册

本文档只覆盖飞书开放平台、多维表格和机器人侧配置，不包含影刀配置与服务端部署。

## 一、实施目标

飞书端要完成 5 件事：

1. 创建企业自建应用
2. 打开机器人与消息卡片能力
3. 为机器人增加固定菜单按钮“影刀应用”
4. 创建多维表格作为配置中心
5. 把事件订阅与交互回调指向服务端

完成后，飞书侧需要向服务端提供这些值：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_VERIFICATION_TOKEN`
- `BITABLE_APP_TOKEN`
- `BITABLE_APPS_TABLE_ID`
- `BITABLE_FIELDS_TABLE_ID`
- `BITABLE_OPTIONS_TABLE_ID`
- `BITABLE_PERMISSIONS_TABLE_ID`

## 二、前置条件

开始前先准备：

- 一个可用的飞书企业管理员账号
- 一个已经备案的 HTTPS 域名，后续用于服务端回调地址
- 至少两个测试用户
  一个有权限用户
  一个无权限用户
- 至少一个要联调的影刀应用名称

## 三、创建飞书应用

1. 进入飞书开放平台，创建“企业自建应用”。
2. 在应用名称里填写一个业务可识别名称，例如“影刀应用中心”。
3. 上传应用图标，后续在飞书侧便于识别。
4. 进入“凭证与基础信息”页面，记录 `App ID` 与 `App Secret`。
5. 在同一页面配置 `Verification Token`。
6. 如果企业策略要求加密消息，可以同时配置 `Encrypt Key`。

当前代码里已经读取这些环境变量：

- [src/config/env.js](/D:/Project/feishu-shadowbot/src/config/env.js#L1)
- [.env.example](/D:/Project/feishu-shadowbot/.env.example#L1)

## 四、开启机器人与消息能力

在飞书开放平台里为应用开启以下能力：

1. 机器人能力
2. 消息发送能力
3. 交互式卡片能力
4. 多维表格读取能力

服务端当前通过 `tenant_access_token` 调用飞书服务端接口，并向用户或会话发送交互卡片消息，相关实现见：

- [src/adapters/feishu-client.js](/D:/Project/feishu-shadowbot/src/adapters/feishu-client.js#L1)
- [src/server.js](/D:/Project/feishu-shadowbot/src/server.js#L86)

飞书接口参考：

- `tenant_access_token` 获取文档  
  https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal
- 发送消息文档  
  https://open.feishu.cn/document/server-docs/im-v1/message/create

## 五、配置机器人菜单按钮

目标是让用户点击一个固定菜单按钮“影刀应用”，然后由服务端返回当前用户可见应用列表卡片。

配置步骤：

1. 打开应用机器人的菜单配置页面。
2. 新增一个菜单按钮，名称固定写成“影刀应用”。
3. 按钮动作选择回调到应用服务端，而不是静态链接。
4. 菜单点击后，需要让飞书把事件回调到服务端统一入口：
   `https://你的域名/api/feishu/callback`
5. 发布菜单配置。

服务端对菜单事件的处理入口见：

- [src/server.js](/D:/Project/feishu-shadowbot/src/server.js#L113)
- [src/app/create-feishu-handler.js](/D:/Project/feishu-shadowbot/src/app/create-feishu-handler.js#L58)

联调标准：

- 用户点击菜单按钮后，能收到一张标题为“可用影刀应用”的卡片
- 有权限用户看到应用按钮
- 无权限用户看到空状态卡片

## 六、配置交互式卡片回调

本项目不是外跳表单，而是在卡片里直接收集参数。所以飞书端必须把卡片动作和表单提交回调到服务端。

配置步骤：

1. 在应用后台找到交互式卡片或事件订阅配置。
2. 将交互回调地址配置为：
   `https://你的域名/api/feishu/callback`
3. 保存后使用飞书提供的校验动作完成地址验证。
4. 校验通过后，发布配置。

当前服务端已支持：

- URL 校验挑战值返回
- 菜单事件处理
- 卡片动作提交处理
- `Verification Token` 校验

代码位置：

- [src/server.js](/D:/Project/feishu-shadowbot/src/server.js#L35)
- [src/core/feishu-auth.js](/D:/Project/feishu-shadowbot/src/core/feishu-auth.js#L1)

飞书卡片交互能力参考：

- 飞书新版消息卡片交互录入示例  
  https://open.feishu.cn/community/articles/7319786721459863556?lang=zh-CN

## 七、创建多维表格配置中心

创建一个多维表格，作为服务端运行时的配置源。该表不直接触发影刀，只存配置。

完整模板与示例数据见：

- [多维表格模板与字段说明](./bitable-template.md)

### 1. 新建多维表格

1. 在飞书新建一个多维表格。
2. 打开该表的 OpenAPI 能力，记录 `App Token`。
3. 记录下面 4 张表的 `table_id`。

### 2. 创建 4 张数据表

需要 4 张表，名称建议固定：

- `apps`
- `app_fields`
- `field_options`
- `app_permissions`

服务端读取逻辑见：

- [src/services/bitable-config-service.js](/D:/Project/feishu-shadowbot/src/services/bitable-config-service.js#L3)
- [src/adapters/bitable-client.js](/D:/Project/feishu-shadowbot/src/adapters/bitable-client.js#L1)
- [src/core/config-parser.js](/D:/Project/feishu-shadowbot/src/core/config-parser.js#L34)

飞书多维表格读取记录接口参考：

- https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list

### 3. `apps` 表字段

按下面字段创建：

| 字段名 | 类型建议 | 说明 |
|---|---|---|
| `app_code` | 单行文本 | 应用唯一编码，必须全局唯一 |
| `app_name` | 单行文本 | 飞书卡片展示名称 |
| `enabled` | 复选框 | 是否启用 |
| `display_order` | 数字 | 应用排序 |
| `description` | 多行文本 | 应用说明 |
| `webhook_url` | 单行文本 | 影刀高级任务计划 Webhook 地址 |
| `webhook_method` | 单行文本 | 固定填 `POST` |
| `timeout_seconds` | 数字 | Webhook 超时秒数 |
| `success_text` | 单行文本 | 提交成功后卡片提示 |
| `payload_meta_prefix` | 单行文本 | 建议固定填 `_meta_` |
| `form_version` | 数字 | 每次改表单结构时递增 |

### 4. `app_fields` 表字段

| 字段名 | 类型建议 | 说明 |
|---|---|---|
| `app_code` | 单行文本 | 关联应用编码 |
| `field_key` | 单行文本 | 提交给影刀的参数名 |
| `field_label` | 单行文本 | 卡片字段标题 |
| `field_type` | 单行文本 | 支持 `text`、`textarea`、`number`、`select`、`date`、`datetime` |
| `required` | 复选框 | 是否必填 |
| `placeholder` | 单行文本 | 输入提示 |
| `default_type` | 单行文本 | 当前版本保留字段 |
| `default_value` | 单行文本 | 当前版本保留字段 |
| `validation_regex` | 单行文本 | 正则校验表达式 |
| `validation_message` | 单行文本 | 校验失败提示 |
| `sort_order` | 数字 | 字段排序 |
| `enabled` | 复选框 | 是否启用 |

注意：

- 同一 `app_code` 下，`field_key` 不能重复
- 当前解析器遇到重复 `field_key` 会直接报错

### 5. `field_options` 表字段

只给 `select` 字段使用。

| 字段名 | 类型建议 | 说明 |
|---|---|---|
| `app_code` | 单行文本 | 关联应用编码 |
| `field_key` | 单行文本 | 关联字段键 |
| `option_label` | 单行文本 | 选项显示名 |
| `option_value` | 单行文本 | 选项提交值 |
| `sort_order` | 数字 | 排序 |
| `enabled` | 复选框 | 是否启用 |

### 6. `app_permissions` 表字段

当前版本按飞书 `open_id` 做直配授权。

| 字段名 | 类型建议 | 说明 |
|---|---|---|
| `app_code` | 单行文本 | 关联应用编码 |
| `feishu_open_id` | 单行文本 | 飞书用户 `open_id` |
| `enabled` | 复选框 | 是否启用 |
| `valid_from` | 日期时间 | 生效时间，可空 |
| `valid_to` | 日期时间 | 失效时间，可空 |
| `remark` | 多行文本 | 备注 |

## 八、飞书侧联调步骤

1. 在 `app_permissions` 里给测试用户 A 增加授权。
2. 不给测试用户 B 授权。
3. 在 `apps`、`app_fields` 里先配置 1 个应用。
4. 把服务端部署好以后，分别用 A、B 两个账号点击“影刀应用”菜单。
5. 用 A 账号打开应用卡片并提交一次表单。

预期结果：

- A 能看到应用按钮
- B 只能看到空状态
- A 提交后能收到成功卡片

## 九、飞书侧常见问题

### 1. 菜单按钮点击没有任何反应

重点检查：

- 菜单是否已经发布
- 事件订阅地址是否可从公网访问
- `Verification Token` 是否与服务端环境变量一致
- 服务端 `/api/feishu/callback` 是否返回 200

### 2. 卡片能展示，但按钮点击后报未授权

重点检查：

- `app_permissions.feishu_open_id` 是否存的是 `open_id`
- 是否误填了邮箱、手机号或姓名
- 是否设置了 `valid_to` 且已过期

### 3. 多维表格改了配置，但卡片没更新

当前服务端默认有 30 秒缓存。等待 30 秒后再试，或重启服务。
