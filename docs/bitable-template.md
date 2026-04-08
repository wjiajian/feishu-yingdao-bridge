# 多维表格模板与字段说明

本文档给出本项目所需的多维表格模板。建议在同一个多维表格应用里创建 4 张表：

1. `apps`
2. `app_fields`
3. `field_options`
4. `app_permissions`

可直接导入的 CSV 文件放在：

- [docs/bitable-csv/apps.csv](/D:/Project/feishu-shadowbot/docs/bitable-csv/apps.csv)
- [docs/bitable-csv/app_fields.csv](/D:/Project/feishu-shadowbot/docs/bitable-csv/app_fields.csv)
- [docs/bitable-csv/field_options.csv](/D:/Project/feishu-shadowbot/docs/bitable-csv/field_options.csv)
- [docs/bitable-csv/app_permissions.csv](/D:/Project/feishu-shadowbot/docs/bitable-csv/app_permissions.csv)

服务端会按这 4 张表的内容动态生成飞书卡片，并在提交时决定是否允许当前用户触发对应影刀应用。

相关代码位置：

- [src/services/bitable-config-service.js](/D:/Project/feishu-shadowbot/src/services/bitable-config-service.js#L3)
- [src/core/config-parser.js](/D:/Project/feishu-shadowbot/src/core/config-parser.js#L34)
- [src/core/permission-service.js](/D:/Project/feishu-shadowbot/src/core/permission-service.js#L1)

## 一、`apps` 表

这张表定义“有哪些影刀应用可以展示给用户”。

### 字段模板

| 字段名 | 类型建议 | 必填 | 示例 | 说明 |
|---|---|---|---|---|
| `app_code` | 单行文本 | 是 | `leave_sync` | 应用唯一编码，后续所有子表都通过它关联 |
| `app_name` | 单行文本 | 是 | `请假同步` | 飞书卡片展示名称 |
| `enabled` | 复选框 | 是 | `true` | 是否启用；未启用的应用不会展示 |
| `display_order` | 数字 | 是 | `10` | 应用排序，数值越小越靠前 |
| `description` | 多行文本 | 否 | `同步请假单到业务系统` | 应用说明，显示在应用按钮下方 |
| `webhook_url` | 单行文本 | 是 | `https://yingdao.example/webhook/abc` | 影刀高级任务计划 Webhook 地址 |
| `webhook_method` | 单行文本 | 是 | `POST` | 当前固定使用 `POST` |
| `timeout_seconds` | 数字 | 否 | `15` | 调用影刀 Webhook 的超时秒数 |
| `success_text` | 单行文本 | 否 | `已提交，请等待处理` | 飞书卡片提交成功提示 |
| `payload_meta_prefix` | 单行文本 | 否 | `_meta_` | 元信息前缀，建议保持默认 |
| `form_version` | 数字 | 是 | `1` | 表单版本；改字段结构后递增 |

### 示例数据

| app_code | app_name | enabled | display_order | description | webhook_url | webhook_method | timeout_seconds | success_text | payload_meta_prefix | form_version |
|---|---|---:|---:|---|---|---|---:|---|---|---:|
| `leave_sync` | `请假同步` | `true` | `10` | `同步请假单到业务系统` | `https://yingdao.example/webhook/leave-sync` | `POST` | `15` | `已提交，请等待处理` | `_meta_` | `1` |
| `expense_sync` | `报销同步` | `true` | `20` | `同步报销申请到财务流程` | `https://yingdao.example/webhook/expense-sync` | `POST` | `15` | `已提交，请等待处理` | `_meta_` | `1` |

### 填写约束

- `app_code` 必须全局唯一
- `app_code` 只建议使用小写英文、数字、下划线
- `form_version` 只要表单字段结构变化，就要加 1
- `webhook_url` 必须对应影刀已发布的高级任务计划

## 二、`app_fields` 表

这张表定义“每个影刀应用在飞书卡片中要显示哪些字段”。

### 字段模板

| 字段名 | 类型建议 | 必填 | 示例 | 说明 |
|---|---|---|---|---|
| `app_code` | 单行文本 | 是 | `leave_sync` | 关联 `apps.app_code` |
| `field_key` | 单行文本 | 是 | `employee_no` | 字段唯一键，同时也是提交给影刀的参数名 |
| `field_label` | 单行文本 | 是 | `工号` | 飞书卡片字段标题 |
| `field_type` | 单行文本 | 是 | `text` | 当前支持 `text`、`textarea`、`number`、`select`、`date`、`datetime` |
| `required` | 复选框 | 是 | `true` | 是否必填 |
| `placeholder` | 单行文本 | 否 | `请输入 6 位工号` | 字段提示文案 |
| `default_type` | 单行文本 | 否 | `none` | 当前版本保留字段，建议固定填 `none` |
| `default_value` | 单行文本 | 否 | `` | 当前版本保留字段 |
| `validation_regex` | 单行文本 | 否 | `^\d{6}$` | 正则校验表达式 |
| `validation_message` | 单行文本 | 否 | `工号必须为 6 位数字` | 正则校验失败提示 |
| `sort_order` | 数字 | 是 | `10` | 字段排序，数值越小越靠前 |
| `enabled` | 复选框 | 是 | `true` | 是否启用 |

### 示例数据

#### `leave_sync` 示例

| app_code | field_key | field_label | field_type | required | placeholder | default_type | default_value | validation_regex | validation_message | sort_order | enabled |
|---|---|---|---|---|---|---|---|---|---|---:|---|
| `leave_sync` | `employee_no` | `工号` | `text` | `true` | `请输入 6 位工号` | `none` | `` | `^\d{6}$` | `工号必须为 6 位数字` | `10` | `true` |
| `leave_sync` | `leave_type` | `请假类型` | `select` | `true` | `请选择请假类型` | `none` | `` | `` | `` | `20` | `true` |
| `leave_sync` | `start_date` | `开始日期` | `date` | `true` | `请选择开始日期` | `none` | `` | `` | `` | `30` | `true` |
| `leave_sync` | `end_date` | `结束日期` | `date` | `true` | `请选择结束日期` | `none` | `` | `` | `` | `40` | `true` |
| `leave_sync` | `reason` | `请假原因` | `textarea` | `false` | `请输入请假原因` | `none` | `` | `` | `` | `50` | `true` |

#### `expense_sync` 示例

| app_code | field_key | field_label | field_type | required | placeholder | default_type | default_value | validation_regex | validation_message | sort_order | enabled |
|---|---|---|---|---|---|---|---|---|---|---:|---|
| `expense_sync` | `employee_no` | `工号` | `text` | `true` | `请输入 6 位工号` | `none` | `` | `^\d{6}$` | `工号必须为 6 位数字` | `10` | `true` |
| `expense_sync` | `expense_type` | `报销类型` | `select` | `true` | `请选择报销类型` | `none` | `` | `` | `` | `20` | `true` |
| `expense_sync` | `amount` | `金额` | `number` | `true` | `请输入金额` | `none` | `` | `^\d+(\.\d{1,2})?$` | `金额格式不正确` | `30` | `true` |
| `expense_sync` | `remark` | `备注` | `textarea` | `false` | `请输入备注` | `none` | `` | `` | `` | `40` | `true` |

### 填写约束

- 同一个 `app_code` 下，`field_key` 不能重复
- `field_key` 必须与影刀应用参数名一致
- `field_type=select` 时，必须在 `field_options` 表中补选项
- `validation_regex` 留空表示不做格式校验

## 三、`field_options` 表

这张表只给 `select` 类型字段使用。

### 字段模板

| 字段名 | 类型建议 | 必填 | 示例 | 说明 |
|---|---|---|---|---|
| `app_code` | 单行文本 | 是 | `leave_sync` | 关联应用编码 |
| `field_key` | 单行文本 | 是 | `leave_type` | 关联字段键 |
| `option_label` | 单行文本 | 是 | `事假` | 卡片显示名称 |
| `option_value` | 单行文本 | 是 | `personal_leave` | 提交给影刀的值 |
| `sort_order` | 数字 | 是 | `10` | 选项排序 |
| `enabled` | 复选框 | 是 | `true` | 是否启用 |

### 示例数据

| app_code | field_key | option_label | option_value | sort_order | enabled |
|---|---|---|---|---:|---|
| `leave_sync` | `leave_type` | `事假` | `personal_leave` | `10` | `true` |
| `leave_sync` | `leave_type` | `病假` | `sick_leave` | `20` | `true` |
| `leave_sync` | `leave_type` | `年假` | `annual_leave` | `30` | `true` |
| `expense_sync` | `expense_type` | `差旅` | `travel` | `10` | `true` |
| `expense_sync` | `expense_type` | `餐补` | `meal` | `20` | `true` |
| `expense_sync` | `expense_type` | `办公用品` | `office_supply` | `30` | `true` |

### 填写约束

- `app_code + field_key` 必须对应一条真实的 `select` 字段
- `option_value` 要与影刀应用预期枚举一致
- 如需下线选项，优先把 `enabled` 改成 `false`

## 四、`app_permissions` 表

这张表决定“哪些飞书用户可以看到哪些影刀应用”。

### 字段模板

| 字段名 | 类型建议 | 必填 | 示例 | 说明 |
|---|---|---|---|---|
| `app_code` | 单行文本 | 是 | `leave_sync` | 关联应用编码 |
| `feishu_open_id` | 单行文本 | 是 | `ou_xxx` | 飞书用户唯一标识，必须使用 `open_id` |
| `enabled` | 复选框 | 是 | `true` | 是否启用授权 |
| `valid_from` | 日期时间 | 否 | `2026-04-01 00:00:00` | 生效时间，可留空 |
| `valid_to` | 日期时间 | 否 | `2026-04-30 23:59:59` | 失效时间，可留空 |
| `remark` | 多行文本 | 否 | `财务部测试账号` | 备注 |

### 示例数据

| app_code | feishu_open_id | enabled | valid_from | valid_to | remark |
|---|---|---|---|---|---|
| `leave_sync` | `ou_1234567890` | `true` | `2026-04-01 00:00:00` | `2026-12-31 23:59:59` | `人事专员` |
| `leave_sync` | `ou_2234567890` | `true` | `2026-04-01 00:00:00` | `` | `HRBP` |
| `expense_sync` | `ou_3234567890` | `true` | `2026-04-01 00:00:00` | `` | `财务专员` |

### 填写约束

- 必须存飞书 `open_id`，不能存姓名、邮箱、手机号
- `enabled=false` 表示该授权记录失效
- `valid_from`、`valid_to` 都可留空
- 提交时服务端会再次校验权限，旧卡片不能绕过权限变更

## 五、最小可运行模板

如果你想先跑通一条最小链路，至少准备这些数据：

### `apps`

| app_code | app_name | enabled | display_order | description | webhook_url | webhook_method | timeout_seconds | success_text | payload_meta_prefix | form_version |
|---|---|---:|---:|---|---|---|---:|---|---|---:|
| `leave_sync` | `请假同步` | `true` | `10` | `同步请假单到业务系统` | `https://yingdao.example/webhook/leave-sync` | `POST` | `15` | `已提交，请等待处理` | `_meta_` | `1` |

### `app_fields`

| app_code | field_key | field_label | field_type | required | placeholder | default_type | default_value | validation_regex | validation_message | sort_order | enabled |
|---|---|---|---|---|---|---|---|---|---|---:|---|
| `leave_sync` | `employee_no` | `工号` | `text` | `true` | `请输入 6 位工号` | `none` | `` | `^\d{6}$` | `工号必须为 6 位数字` | `10` | `true` |
| `leave_sync` | `reason` | `请假原因` | `textarea` | `false` | `请输入请假原因` | `none` | `` | `` | `` | `20` | `true` |

### `field_options`

这套最小模板不需要下拉字段，可以留空。

### `app_permissions`

| app_code | feishu_open_id | enabled | valid_from | valid_to | remark |
|---|---|---|---|---|---|
| `leave_sync` | `ou_1234567890` | `true` | `2026-04-01 00:00:00` | `` | `测试用户` |

## 六、字段值与服务端行为对应关系

### `enabled`

- 在 4 张表里都支持
- 值为 `false` 时，该记录会被服务端忽略

### `sort_order` 与 `display_order`

- `display_order` 控制应用按钮顺序
- `sort_order` 控制字段和下拉选项顺序

### `form_version`

- 用户打开卡片后，服务端会把当前版本号写入按钮值
- 用户提交时，服务端会比较表单版本
- 如果你改了字段结构却没改 `form_version`，用户可能继续提交旧卡片

### `validation_regex`

- 只对有值的字段做正则校验
- 必填校验和正则校验会同时生效

## 七、建议维护方式

建议按下面顺序维护：

1. 先在影刀端确认参数名
2. 再写 `apps`
3. 再写 `app_fields`
4. 如有下拉字段，再写 `field_options`
5. 最后写 `app_permissions`

上线前至少核对一次：

- 每个 `app_code` 都能在 `apps` 表找到
- 每个 `field_key` 都与影刀入参一致
- 每个 `select` 字段都有对应选项
- 每个测试用户都写的是 `open_id`
