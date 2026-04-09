# 实施文档总览

本项目的落地步骤按三端拆分：

1. 飞书端配置：[飞书端实施手册](./feishu-setup.md)
2. 影刀端配置：[影刀端实施手册](./yingdao-setup.md)
3. 服务端部署：[服务端实施手册](./service-setup.md)
4. 多维表格模板：[多维表格模板与字段说明](./bitable-template.md)
5. CSV 模板文件：[bitable-csv](./bitable-csv/)
6. Docker 部署说明：[Docker.md](../Docker.md)

建议执行顺序：

1. 先完成影刀端，拿到每个高级任务计划的 Webhook 地址。
2. 再完成飞书端，拿到应用凭据、多维表格和回调入口配置。
3. 最后部署服务端，并用真实飞书账号做联调。

联调通过的最小标准：

- 飞书菜单按钮可以返回“可用影刀应用”卡片
- 不同用户只能看到自己有权限的应用
- 点击应用按钮后能在飞书卡片中填写并提交
- 服务端能把参数转发到影刀高级任务计划 Webhook
- 飞书卡片能返回“已提交”结果卡片

参考资料：

- 飞书 `tenant_access_token`：https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal
- 飞书发送消息：https://open.feishu.cn/document/server-docs/im-v1/message/create
- 飞书多维表格读取记录：https://open.feishu.cn/document/server-docs/docs/bitable-v1/app-table-record/list
- 飞书新版消息卡片交互录入示例：https://open.feishu.cn/community/articles/7319786721459863556?lang=zh-CN
- 影刀高级任务计划入门：https://www.yingdao.com/community/detaildiscuss?id=838730599324614656
- 影刀通过 Webhook 接收参数示例：https://www.yingdao.com/community/detaildiscuss?id=928930038031667200
