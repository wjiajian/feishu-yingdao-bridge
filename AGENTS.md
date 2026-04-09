# Repository Guidelines

## Project Structure & Module Organization
源码位于 `src/`。`src/server.js` 负责 HTTP 入口，`src/app/` 处理飞书回调编排，`src/adapters/` 封装飞书和多维表格客户端，`src/config/` 加载环境变量，`src/core/` 放领域逻辑，`src/services/` 放更高层集成。测试位于 `test/`，文件名与模块职责对应，例如 `test/feishu-handler.test.js`。部署和接入文档放在 `docs/`。

## Build, Test, and Development Commands
`npm start`：启动本地服务，自动读取仓库根目录 `.env`。  
`npm test`：执行 `test/run-tests.js` 注册的全部测试。  
`node test/run-tests.js`：与 `npm test` 等价，便于直接调试测试输出。  
联调时先访问 `GET /healthz`，飞书回调地址使用 `POST /api/feishu/callback`。

## Coding Style & Naming Conventions
项目使用 ES modules 和原生 Node.js。保持 2 空格缩进、双引号、分号，以及小而单一职责的函数。文件名使用 kebab-case，例如 `feishu-event-mapper.js`。工厂函数优先使用 `createX` 命名，动作处理函数使用明确动词，例如 `handleCardAction`。注释只写意图、约束和边界，使用简体中文。

## Testing Guidelines
测试框架是仓库内置的轻量 harness：`test/test-harness.js`。新增测试文件命名为 `*.test.js`，并且必须在 `test/run-tests.js` 中显式 `import`，否则 `npm test` 不会执行。修改回调、权限或影刀触发逻辑时，至少补齐成功路径和边界场景测试。

## Commit & Pull Request Guidelines
提交信息以 Conventional Commits 为主，例如 `feat: add cancel card`、`fix(app): ignore expired callbacks`。标题保持简短，作用域可选。Pull Request 需要说明行为变化、配置变更和验证结果；涉及卡片内容或回调行为时，附示例 payload、日志片段或截图。

## Security & Configuration Tips
不要提交真实 `.env`、飞书凭据、多维表格 ID 或影刀 Webhook。新增配置项时同步更新 `.env.example`。修改回调处理时，确认飞书 token 校验、异步 Webhook 路径和日志输出都仍然有效。
