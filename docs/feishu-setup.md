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

菜单按钮名称固定为“影刀应用”，动作选择回调到应用服务端，而不是静态链接。

回调地址：

`https://你的域名/api/feishu/callback`

联调标准：

- 用户点击菜单按钮后，收到标题为“可用影刀应用”的卡片
- 有权限用户看到应用按钮
- 无权限用户看到空状态

## 三、卡片交互回调

当前模型不在飞书卡片内收集参数，但仍然建议把交互回调统一指向：

`https://你的域名/api/feishu/callback`

这样历史卡片或异常点击仍然能被服务端兜底处理。

## 四、多维表格

创建一个多维表格，并记录：

- `App Token`
- `apps` 表 `table_id`
- `app_permissions` 表 `table_id`

字段模板见 [bitable-template.md](/D:/Project/feishu-yingdao-bridge/docs/bitable-template.md)。

## 五、飞书侧联调

1. 在 `app_permissions` 里给测试用户增加授权
2. 在 `apps` 里配置至少 1 个影刀分享表单地址
3. 用已授权用户点击“影刀应用”菜单
4. 确认卡片里能看到“打开影刀表单”按钮
5. 点击按钮后确认已跳转到影刀分享表单

## 六、常见问题

### 1. 菜单点击没有反应

重点检查：

- 菜单是否已经发布
- 回调地址是否可从公网访问
- `FEISHU_VERIFICATION_TOKEN` 是否一致

### 2. 应用列表为空

重点检查：

- `apps.enabled` 是否开启
- `app_permissions.feishu_open_id` 是否填写真实 `open_id`
- 当前用户是否在授权范围内

### 3. 按钮点击后没有跳转

重点检查：

- `apps.form_url` 是否填写完整
- 飞书卡片是否已经刷新
- 影刀分享表单链接本身是否有效
