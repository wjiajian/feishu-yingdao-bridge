# 多维表格模板与字段说明

当前版本只需要两张表：

1. `apps`
2. `app_permissions`

可直接导入的 CSV 文件放在：

- [docs/bitable-csv/apps.csv](/D:/Project/feishu-yingdao-bridge/docs/bitable-csv/apps.csv)
- [docs/bitable-csv/app_permissions.csv](/D:/Project/feishu-yingdao-bridge/docs/bitable-csv/app_permissions.csv)

服务端会读取这两张表，按用户权限返回可见应用列表卡片。

## 一、`apps` 表

### 字段模板

| 字段名 | 类型建议 | 必填 | 示例 | 说明 |
|---|---|---|---|---|
| `app_code` | 单行文本 | 是 | `expense_form` | 应用唯一编码 |
| `app_name` | 单行文本 | 是 | `报销表单` | 飞书卡片展示名称 |
| `enabled` | 复选框 | 是 | `true` | 是否启用；未启用应用不展示 |
| `display_order` | 数字 | 是 | `10` | 排序值，越小越靠前 |
| `description` | 多行文本 | 否 | `提交报销附件` | 应用说明 |
| `form_url` | 单行文本 | 是 | `https://console.yingdao.com/...` | 影刀分享表单地址 |
| `success_text` | 单行文本 | 否 | `请在影刀表单中提交` | 卡片中展示的提示文案 |

### 示例数据

| app_code | app_name | enabled | display_order | description | form_url | success_text |
|---|---|---:|---:|---|---|---|
| `expense_form` | `报销表单` | `true` | `10` | `提交报销附件` | `https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123` | `请在影刀表单中提交` |
| `contract_form` | `合同申请` | `true` | `20` | `填写合同申请信息` | `https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=456` | `请在影刀表单中提交` |

### 填写约束

- `app_code` 必须全局唯一
- `app_code` 建议只使用小写英文、数字、下划线
- `form_url` 必须填写完整、可访问的影刀分享表单链接
- `success_text` 留空时，服务端会显示默认提示文案

## 二、`app_permissions` 表

### 字段模板

| 字段名 | 类型建议 | 必填 | 示例 | 说明 |
|---|---|---|---|---|
| `app_code` | 单行文本 | 是 | `expense_form` | 关联应用编码 |
| `feishu_open_id` | 单行文本 | 否 | `ou_xxx` | 飞书用户唯一标识，必须使用 `open_id` |
| `feishu_department_id` | 单行文本 | 否 | `od-xxxx` | 飞书直属部门标识，必须使用 `department_id` |
| `enabled` | 复选框 | 是 | `true` | 是否启用授权 |
| `valid_from` | 日期时间 | 否 | `2026-04-01 00:00:00` | 生效时间，可留空 |
| `valid_to` | 日期时间 | 否 | `2026-04-30 23:59:59` | 失效时间，可留空 |
| `remark` | 多行文本 | 否 | `财务测试账号` | 备注 |

### 示例数据

| app_code | feishu_open_id | feishu_department_id | enabled | valid_from | valid_to | remark |
|---|---|---|---|---|---|---|
| `expense_form` | `ou_1234567890` | `` | `true` | `2026-04-01 00:00:00` | `` | `财务专员` |
| `contract_form` | `` | `od-7abcef1234567890` | `true` | `2026-04-01 00:00:00` | `` | `法务部` |

### 填写约束

- `feishu_open_id` 与 `feishu_department_id` 至少填写一个
- `feishu_open_id` 必须存飞书 `open_id`，不能存姓名、邮箱、手机号
- `feishu_department_id` 必须存飞书 `department_id`，当前只按直属部门匹配
- `enabled=false` 表示该授权记录失效
- `valid_from`、`valid_to` 都可以留空
- 服务端发卡片前会再次校验权限

## 三、最小可运行模板

至少准备：

### `apps`

| app_code | app_name | enabled | display_order | description | form_url | success_text |
|---|---|---:|---:|---|---|---|
| `expense_form` | `报销表单` | `true` | `10` | `提交报销附件` | `https://console.yingdao.com/dispatch/app/senior-plan/share/form?flowId=123` | `请在影刀表单中提交` |

### `app_permissions`

| app_code | feishu_open_id | feishu_department_id | enabled | valid_from | valid_to | remark |
|---|---|---|---|---|---|---|
| `expense_form` | `ou_1234567890` | `` | `true` | `2026-04-01 00:00:00` | `` | `测试用户` |

## 四、建议维护顺序

1. 先在影刀侧创建分享表单
2. 再写 `apps`
3. 最后写 `app_permissions`
