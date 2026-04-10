# 飞书端实施手册

本文档只覆盖飞书开放平台、多维表格和机器人侧配置。

## 一、实施目标

飞书端需要完成这些配置：

1. 创建企业自建应用
2. 开启机器人、消息卡片和多维表格读取能力
3. 为机器人增加固定菜单按钮“影刀应用”
4. 配置事件订阅与卡片交互回调
5. 创建两张多维表：`apps`、`app_permissions`

完成后，需要向服务端提供这些值：

- `FEISHU_APP_ID`
- `FEISHU_APP_SECRET`
- `FEISHU_VERIFICATION_TOKEN`
- `BITABLE_APP_TOKEN`
- `BITABLE_APPS_TABLE_ID`
- `BITABLE_PERMISSIONS_TABLE_ID`

## 二、机器人菜单

菜单按钮名称固定为“影刀应用”，动作选择推送事件，而不是静态链接。

事件名称（默认）：

`open_shadowbot_apps`

![alt text](/resources/菜单配置.png)

联调标准：

- 用户点击菜单按钮后，收到标题为“可用影刀应用”的卡片
- 有权限用户看到应用按钮
- 无权限用户看到空状态

## 三、卡片交互回调

当前模型不在飞书卡片内收集参数，但仍然建议把交互回调统一指向：

`https://你的域名/api/feishu/callback`

这样历史卡片或异常点击仍然能被服务端兜底处理。

![alt text](/resources/回调配置.png)

## 四、重定向URL
在开发网页应用的用户登录操作时，开放平台会通过 **OAuth 2.0** 协议授权用户登录并向应用后台提供用户的资源和信息。在授权登录过程中，开放平台会对网页进行安全校验，只有配置在应用重定向 URL 列表内的网页地址可以通过安全校验。

![alt text](/resources/重定向URL.png)

URL 包含 “?” 或 “#” 后缀时，如何设置重定向 URL？
开发者后台的应用重定向 URL 列表内需要包含完整路径，如果路径后有 `?` 或者 `#` 后缀，可以不包含在重定向 URL 中。

**原因说明**：在应用的重定向 URL 列表内配置的 URL，`?` 或 `#` 后缀不会生效。例如，`http://www.example.com/#/index` 作为重定向 URL 时，实际生效的 URL 为 `http://www.example.com`。

## 五、多维表格

创建一个多维表格，并记录：

- `App Token`
- `apps` 表 `table_id`
- `app_permissions` 表 `table_id`

字段模板见 [bitable-template.md](/D:/Project/feishu-yingdao-bridge/docs/bitable-template.md)。

## 六、飞书侧联调

1. 在 `app_permissions` 里给测试用户或测试部门增加授权
2. 在 `apps` 里配置至少 1 个影刀分享表单地址
3. 用已授权用户点击“影刀应用”菜单
4. 确认卡片里能看到“打开影刀表单”按钮
5. 点击按钮后确认已跳转到影刀分享表单

## 七、常见问题

### 1. 菜单点击没有反应

重点检查：

- 菜单是否已经发布
- 回调地址是否可从公网访问
- `FEISHU_VERIFICATION_TOKEN` 是否一致

### 2. 应用列表为空

重点检查：

- `apps.enabled` 是否开启
- `app_permissions.feishu_open_id` 是否填写真实 `open_id`
- `app_permissions.feishu_department_id` 是否填写真实 `department_id`
- 当前用户是否在授权范围内

### 3. 按钮点击后没有跳转

重点检查：

- `apps.form_url` 是否填写完整
- 飞书卡片是否已经刷新
- 影刀分享表单链接本身是否有效
