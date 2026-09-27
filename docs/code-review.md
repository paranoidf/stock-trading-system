# 独立代码审查记录

## 审查范围

审查覆盖当前 `master` 的产品代码、测试、构建、Docker、Playwright 和说明文档。审查维度包括：功能正确性、安全与身份边界、并发和生命周期、测试充分性、可读性及规格一致性。

## 首轮发现

### CR-01：退出流程与已建立 WebSocket 会话撤销缺失

- 严重级别：Required
- 位置：`apps/web/src/App.vue`、`apps/server/src/modules/auth.ts`、`apps/server/src/realtime/websocket.ts`
- 证据：规格 `TW-01` 要求 UI 可以退出，`IS-03` 要求退出会话不能继续接收私有 WebSocket；当前页面没有退出按钮，`destroySession` 只删除 token，既有 WebSocket 仍保留在用户频道。
- 建议：增加可测试退出入口；销毁 session 时按 token 主动终止相关 WebSocket，并验证私有状态清理和重新登录可重新建立连接。
- 状态：已修复。增加 UI 退出、控制器停止与 token 级 WebSocket 撤销测试。

### CR-02：重连退避参数偏离批准规格

- 严重级别：Required
- 位置：`apps/web/src/services/reconnect.ts`
- 证据：`SPEC-reconnect-recovery.md` 要求首次约 500ms、最大 10s和小幅随机抖动；当前默认值为 1,000ms、30,000ms且无抖动。
- 建议：注入随机源，采用 500ms 指数退避、10s 上限和有界抖动，并以假时钟锁定范围与单定时器不变量。
- 状态：已修复。默认退避改为 500ms 起步、10s 上限和正负 10% 抖动。

### CR-03：实时事件仅验证外壳而不验证 DTO 结构

- 严重级别：Required
- 位置：`apps/web/src/services/realtime.ts`
- 证据：类型为 `market.updated` 但 `data` 为对象等结构错误载荷会被强制转换为 `RealtimeEvent` 并传入 store，可能破坏渲染；这不满足 T15 的无效载荷安全忽略条件。
- 建议：为四类事件实现最小运行时结构校验，并加入合法类型、非法 data 的负向测试。
- 状态：已修复。四类事件均执行最小 DTO 运行时校验，错误结构返回 `null`。

### CR-04：WebSocket 握手 401 会进入无限重连

- 严重级别：Required
- 位置：`apps/web/src/services/reconnect.ts`、`apps/server/src/realtime/websocket.ts`
- 证据：服务端对无效 token 的升级请求返回 HTTP 401；浏览器 WebSocket 不向业务代码暴露该 HTTP 状态，只产生关闭事件。当前关闭路径直接安排下一次重连，无法进入仅存在于“连接成功后快照失败”的 401 清理分支。
- 建议：关闭后执行可注入的会话探测；401 停止控制器并清理私有状态，网络错误或有效会话继续退避。
- 状态：已修复。关闭后通过 `GET /api/session` 探测，401 会停止并清理，普通失败继续退避。

## 非阻断观察

- 内存态认证没有限流、持久化或跨进程撤销能力；已在 README 明确为本地模拟系统限制，不作为当前范围阻断项。
- 全局成交记录按规格限制为 500 条，用户视图取其中最近 50 条；该行为与已批准规格一致。

## 复审结论

全部 4 个 Required 项均已关闭，没有 Critical 或未解决 Required 发现。复审实际运行 `git diff --check && npm test && npm run build`：差异检查通过，16 个单元测试文件 34 个测试通过，8 个集成测试文件 13 个测试通过，三个 workspace 构建通过。Windows 行尾转换提示不影响差异正确性。
