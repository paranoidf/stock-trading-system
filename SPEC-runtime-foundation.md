# 模块规格：`runtime-foundation`

## 目标

建立跨平台 npm workspaces、共享类型、统一命令和生产静态服务入口，为其余模块提供可复现运行基础。

## 边界与接口

- 工作区包含 `apps/web`、`apps/server`、`packages/shared`。
- 开发期前后端分别运行，Vite 代理 `/api` 与 `/ws`；生产期 Express 提供构建后的静态前端。
- `GET /api/health` 返回进程就绪状态，不泄露敏感信息。
- 根命令及目录结构以 `SPEC.md` 第 5、7 节为准。

## 验收条件

- `RF-01`：全新环境执行 `npm install` 后，全部标准命令存在且失败时返回非零退出码。
- `RF-02`：`npm run dev` 同时启动前后端，页面能访问 API 和 WebSocket。
- `RF-03`：`npm run build && npm start` 通过一个服务地址提供页面、API、WebSocket 与健康检查。
- `RF-04`：共享 DTO 可被前后端类型检查消费，且不存在反向引用应用层代码。
- `RF-05`：停止服务后不遗留子进程或占用端口。

## 非目标

不包含云部署、CI/CD、数据库、多进程协调或生产级可观测平台。
