# 股票模拟交易系统执行清单

> 状态说明：`[ ]` 未开始，`[~]` 进行中，`[x]` 已完成，`[!]` 阻塞。当前所有命令均为未来验证命令，不表示已经执行或通过。

## 阶段一：基础与高风险领域内核

## [x] T01：建立 npm 工作区与包边界

**任务目标：** 建立根工作区及 web、server、shared 三个包的最小清单，固定规格指定依赖版本。

**依赖项：** 无。

**验收条件：**
- [x] npm 能识别三个 workspace，依赖由单一 `package-lock.json` 固定。
- [x] 根脚本名称覆盖规格定义的 dev、test、build、start 入口。
- [x] 不包含业务实现或未批准依赖。

**RED 阶段的预期失败：** `npm install` 或 workspace 查询因根 `package.json` 不存在而失败。

**GREEN 阶段的验证命令：** `npm install && npm query .workspace`

**完成后的回归验证：** `npm install --package-lock-only`

**预计修改范围：** `package.json`、`package-lock.json`、`apps/web/package.json`、`apps/server/package.json`、`packages/shared/package.json`，中型，5 个文件。

**是否适用 TDD：** 否；这是构建清单配置，使用命令失败/成功验证替代业务测试。

## [x] T02：建立 TypeScript、Lint 与 Vitest 基线

**任务目标：** 提供严格类型检查、代码规范和可分层运行的测试配置。

**依赖项：** T01。

**验收条件：**
- [x] 三个 workspace 继承严格 TypeScript 基线。
- [x] 根目录存在 lint、typecheck、unit、integration、coverage 命令。
- [x] 无测试时命令行为明确，不会掩盖配置错误。

**RED 阶段的预期失败：** `npm run typecheck` 与 `npm run test:unit` 因配置文件不存在而失败。

**GREEN 阶段的验证命令：** `npm run lint && npm run typecheck && npm run test:unit`

**完成后的回归验证：** `npm test`

**预计修改范围：** `tsconfig.base.json`、`eslint.config.js`、`vitest.workspace.ts`、`.gitignore`，中型，4 个文件。

**是否适用 TDD：** 否；工具链配置通过静态检查与测试运行器自检验收。

## [x] T03：固定共享 DTO、金额与股票种子契约

**任务目标：** 定义 API/事件判别类型、整数分转换及包含不可变基准价的股票种子配置。

**依赖项：** T02。

**验收条件：**
- [x] 金额只在边界转换为两位小数字符串，领域值保持安全整数。
- [x] 股票种子包含唯一代码、名称、初始价和不可变基准价。
- [x] 当前行情变化不改变用于账户初始平均成本的基准价。

**RED 阶段的预期失败：** 共享契约单元测试因金额转换与种子配置模块不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/shared vitest -- run`

**完成后的回归验证：** `npm run typecheck && npm run test:unit`

**预计修改范围：** `packages/shared/src/contracts.ts`、`packages/shared/src/money.ts`、`packages/shared/src/stock-seeds.ts`、`packages/shared/tests/shared.test.ts`，中型，4 个文件。

**是否适用 TDD：** 是；先固定边界值、舍入和种子不变性失败用例。

### 检查点 A1：工作区与共享契约

- [x] workspace、静态检查和测试入口可执行。
- [x] 金额、事件 DTO 与股票种子基准价契约稳定。
- [x] 未引入业务实现之外的额外范围。

## [x] T04：建立可测试服务器生命周期

**任务目标：** 提供 Express 应用工厂、`GET /api/health`、启动与干净关闭能力。

**依赖项：** T02、T03。

**验收条件：**
- [x] 测试可在随机端口创建和关闭独立应用实例。
- [x] 健康端点返回稳定 JSON 且不泄露内部信息。
- [x] 关闭后无遗留定时器或端口占用。

**RED 阶段的预期失败：** 健康检查集成测试因应用工厂和路由不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/health.integration.test.ts`

**完成后的回归验证：** `npm run typecheck && npm run test:integration`

**预计修改范围：** `apps/server/src/app.ts`、`apps/server/src/server.ts`、`apps/server/src/lifecycle.ts`、`apps/server/tests/health.integration.test.ts`，中型，4 个文件。

**是否适用 TDD：** 是；先写健康端点与关闭生命周期测试。

## [x] T05：实现账户种子资产与账本不变量

**任务目标：** 创建 100 万初始现金、每支种子股票 1,000 股及确定性平均成本，并实现可用/冻结资源操作。

**依赖项：** T03、T04。

**验收条件：**
- [x] 新账户现金为 `100000000` 分，每支股票总量/可用量为 1,000、冻结量为 0。
- [x] 在不同当前行情下创建账户，平均成本始终等于种子基准价。
- [x] 冻结、结算和失败回滚保持非负与 `quantity = availableQuantity + reservedQuantity`。

**RED 阶段的预期失败：** 账户初始化、成本复现、资金/持仓冻结测试因账本不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/account-ledger.unit.test.ts`

**完成后的回归验证：** `npm run test:unit && npm run typecheck`

**预计修改范围：** `apps/server/src/domain/account-ledger.ts`、`apps/server/src/domain/account-types.ts`、`apps/server/tests/account-ledger.unit.test.ts`，中型，3 个文件。

**是否适用 TDD：** 是；账本不变量和种子成本必须由失败测试先锁定。

### 检查点 A2：服务器与账户基线

- [x] 服务器应用可独立创建和关闭。
- [x] 注册账户种子资产与平均成本规则有确定性测试。
- [x] 100 万初始现金与持仓市值明确分离。

## [x] T06：实现限价委托簿与卖单持仓冻结

**任务目标：** 实现输入校验、稳定序号、价格时间排序及买单现金/卖单可用持仓预占。

**依赖项：** T05。

**验收条件：**
- [x] 买卖盘分别按规格排序，同时间戳仍由 `sequence` 决定。
- [x] 卖单只能使用 `availableQuantity`，接单后等量转入 `reservedQuantity`。
- [x] 资源不足或非法输入不进入订单簿且账本不变。

**RED 阶段的预期失败：** 排序、裸卖空拒绝和卖单冻结测试因委托簿不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/order-book.unit.test.ts`

**完成后的回归验证：** `npm run test:unit`

**预计修改范围：** `apps/server/src/domain/order-book.ts`、`apps/server/src/domain/order-types.ts`、`apps/server/tests/order-book.unit.test.ts`，中型，3 个文件。

**是否适用 TDD：** 是；排序和资源预占均可用纯领域测试驱动。

## [x] T07：实现价格时间优先撮合与原子结算

**任务目标：** 支持交叉判断、静态挂单价、部分/多笔成交以及现金和股票原子转移。

**依赖项：** T06。

**验收条件：**
- [x] 严格遵循价格优先、时间优先及静态挂单价。
- [x] 部分成交后仅剩余数量继续冻结，完全成交后不再占用资源。
- [x] 任一步失败时订单、现金、冻结持仓和成交记录整体不变。

**RED 阶段的预期失败：** 交叉、部分成交和失败回滚测试因撮合引擎不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/matching-engine.unit.test.ts`

**完成后的回归验证：** `npm run test:unit && npm run typecheck`

**预计修改范围：** `apps/server/src/domain/matching-engine.ts`、`apps/server/src/domain/trade-types.ts`、`apps/server/tests/matching-engine.unit.test.ts`、`apps/server/src/domain/account-ledger.ts`，中型，4 个文件。

**是否适用 TDD：** 是；撮合规则和事务不变量必须先由失败用例定义。

## [x] T08：补齐撮合守恒与覆盖率矩阵

**任务目标：** 覆盖一对多、多对一、自成交、不同股票隔离、价差返还及资金/股票总量守恒。

**依赖项：** T07。

**验收条件：**
- [x] 规格 `matching-test-suite` 的全部测试族均有确定性用例。
- [x] 双用户成交后卖方冻结量减少、买方可用量增加，现金和股票总量守恒。
- [x] 撮合引擎与账本四项覆盖率达到 90%，服务端整体目标可度量。

**RED 阶段的预期失败：** 新增边界和守恒用例至少暴露尚未覆盖或不满足的不变量。

**GREEN 阶段的验证命令：** `npm run test:coverage`

**完成后的回归验证：** `npm test`

**预计修改范围：** `apps/server/tests/matching-invariants.unit.test.ts`、`apps/server/tests/matching-engine.unit.test.ts`、`apps/server/tests/account-ledger.unit.test.ts`、`apps/server/vitest.config.ts`，中型，4 个文件。

**是否适用 TDD：** 是；新增每个场景时先观察失败，再做最小领域修正。

### 检查点 A3：领域内核

- [x] `npm run lint`、`npm run typecheck`、`npm run test:unit` 已在执行阶段真实通过。
- [x] 种子成本、禁止裸卖空、持仓冻结、部分成交和守恒测试齐全。
- [x] 任一失败都阻止进入 REST 与 UI 交易切片。

## 阶段二：认证、行情与 REST 纵向切片

## [x] T09：建立前端壳、API 客户端与快照状态容器

**任务目标：** 建立 Vue 应用入口、路由级状态、统一 API 错误和可替换快照状态容器。

**依赖项：** T03、T04。

**验收条件：**
- [x] 前端可启动并渲染明确的加载状态。
- [x] API 客户端统一处理 JSON、Cookie 和错误结构。
- [x] 状态容器可原子替换 session、market、orders、portfolio、trades。

**RED 阶段的预期失败：** 组件测试因应用入口和状态容器不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/web vitest -- run src/stores/session.test.ts`

**完成后的回归验证：** `npm run typecheck && npm run test:unit`

**预计修改范围：** `apps/web/src/main.ts`、`apps/web/src/App.vue`、`apps/web/src/services/api.ts`、`apps/web/src/stores/session.ts`、`apps/web/src/stores/session.test.ts`，中型，5 个文件。

**是否适用 TDD：** 是；API 错误和快照替换可先以 store 测试定义。

## [x] T10：交付注册登录与初始账户快照纵向切片

**任务目标：** 贯通用户服务、Cookie 会话、认证 API、前端表单和注册后种子账户展示。

**依赖项：** T04、T05、T09。

**验收条件：**
- [x] 注册、登录、会话恢复、退出及错误码符合规格。
- [x] 注册后的首个快照含 100 万现金和每支股票 1,000 股、0 冻结、基准成本。
- [x] 不同会话不能读取彼此账户，密码明文不被存储或返回。

**RED 阶段的预期失败：** 认证集成测试和认证组件测试因路由、会话与表单不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/auth.integration.test.ts && npm exec --workspace @stock-trading/web vitest -- run src/components/AuthPanel.test.ts`

**完成后的回归验证：** `npm test`

**预计修改范围：** `apps/server/src/modules/auth.ts`、`apps/server/src/routes/auth.ts`、`apps/server/tests/auth.integration.test.ts`、`apps/web/src/components/AuthPanel.vue`、`apps/web/src/components/AuthPanel.test.ts`，中型，5 个文件。

**是否适用 TDD：** 是；API 与 UI 都先以失败的用户流程测试定义。

## [x] T11：交付模拟行情 REST 与行情看板纵向切片

**任务目标：** 贯通可控行情模拟器、股票查询 API 和前端行情看板。

**依赖项：** T03、T04、T09。

**验收条件：**
- [x] 至少 3 支股票每秒按边界波动，价格为正且保留两位小数。
- [x] API 返回代码、名称、最新价、涨跌幅、更新时间。
- [x] 看板正确呈现加载、数据和错误状态，不改变种子基准价。

**RED 阶段的预期失败：** 可控时钟测试、行情 API 测试和看板测试因功能不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/market.unit.test.ts tests/market.integration.test.ts && npm exec --workspace @stock-trading/web vitest -- run src/components/MarketBoard.test.ts`

**完成后的回归验证：** `npm test`

**预计修改范围：** `apps/server/src/modules/market.ts`（同时导出 Router）、`apps/server/tests/market.unit.test.ts`、`apps/server/tests/market.integration.test.ts`、`apps/web/src/components/MarketBoard.vue`、`apps/web/src/components/MarketBoard.test.ts`，中型，5 个文件。

**是否适用 TDD：** 是；随机与定时行为必须通过注入依赖先测试。

### 检查点 B：认证与行情

- [x] 新用户注册后的初始账户快照与基准成本可复现。
- [x] 行情 REST 和 UI 可独立运行且不会参与撮合。
- [x] `npm test` 已在执行阶段真实通过。

## [x] T12：交付下单、查询、撮合与快照 REST 切片

**任务目标：** 把领域内核接入受保护 REST API，提供订单、账户、成交和聚合快照。

**依赖项：** T06、T07、T10、T11。

**验收条件：**
- [x] `POST /api/orders` 校验并原子执行预占与撮合。
- [x] orders、portfolio、trades、snapshot 只返回当前用户数据。
- [x] 双用户可用初始资产提交交叉订单并得到一致 REST 状态。

**RED 阶段的预期失败：** 双用户交易 API 集成测试因交易路由和应用服务不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/trading.integration.test.ts`

**完成后的回归验证：** `npm run test:unit && npm run test:integration`

**预计修改范围：** `apps/server/src/modules/trading.ts`、`apps/server/src/routes/trading.ts`、`apps/server/src/app.ts`、`apps/server/tests/trading.integration.test.ts`，中型，4 个文件。

**是否适用 TDD：** 是；以双用户 API 场景驱动应用服务组合。

## [x] T13：交付交易表单与委托列表纵向切片

**任务目标：** 让用户从 UI 提交买卖限价单并观察未成交、部分成交和已成交状态。

**依赖项：** T12。

**验收条件：**
- [x] 表单支持股票、方向、价格、整数数量及重复提交保护。
- [x] 服务端拒绝信息可理解地显示，客户端校验不替代服务端。
- [x] 委托列表显示原始量、剩余量、方向、价格、状态和时间。

**RED 阶段的预期失败：** 交易表单与订单 store 测试因组件和操作不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/web vitest -- run src/components/TradeTicket.test.ts src/stores/trading.test.ts`

**完成后的回归验证：** `npm test`

**预计修改范围：** `apps/web/src/components/TradeTicket.vue`、`apps/web/src/components/OrderList.vue`、`apps/web/src/stores/trading.ts`、`apps/web/src/components/TradeTicket.test.ts`、`apps/web/src/stores/trading.test.ts`，中型，5 个文件。

**是否适用 TDD：** 是；从交互与状态转换测试开始。

## [x] T14：交付资金、持仓、总资产与成交视图

**任务目标：** 展示初始现金、可用/占用现金、总/可用/冻结持仓、平均成本、当前总资产及最近成交。

**依赖项：** T13。

**验收条件：**
- [x] 明确区分 100 万初始现金和包含持仓市值的总资产。
- [x] 卖单提交后冻结量增加，成交后卖方总量减少、买方可用量增加。
- [x] 最近 50 条成交显示股票、方向、价格、数量和时间。

**RED 阶段的预期失败：** 账户与成交组件测试因视图不存在或总资产算法缺失而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/web vitest -- run src/components/PortfolioPanel.test.ts src/components/TradeHistory.test.ts`

**完成后的回归验证：** `npm test`

**预计修改范围：** `apps/web/src/components/PortfolioPanel.vue`、`apps/web/src/components/TradeHistory.vue`、`apps/web/src/stores/trading.ts`、`apps/web/src/components/PortfolioPanel.test.ts`、`apps/web/src/components/TradeHistory.test.ts`，中型，5 个文件。

**是否适用 TDD：** 是；金额、估值和持仓状态展示可由固定快照驱动测试。

### 检查点 C：REST 交易闭环

- [x] 双用户能以初始资产通过 REST 完成首笔成交。
- [x] 资金、股票数量和冻结状态一致且守恒。
- [x] 前端完整显示认证、行情、下单、委托、账户和成交。

## 阶段三：实时通信与恢复

## [x] T15：交付公共行情 WebSocket

**任务目标：** 建立 WebSocket 升级、消息协议和公共 `market.updated` 推送，并让看板实时更新。

**依赖项：** T11、T12。

**验收条件：**
- [x] 有效连接收到版本化行情事件，无效载荷被安全忽略。
- [x] 行情看板无需刷新即可变化。
- [x] 断开连接会清理监听器，关闭服务器会释放连接和定时器。

**RED 阶段的预期失败：** WebSocket 行情集成测试和前端实时服务测试因升级处理不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/websocket-market.integration.test.ts && npm exec --workspace @stock-trading/web vitest -- run src/services/realtime.test.ts`

**完成后的回归验证：** `npm run test:integration && npm run test:unit`

**预计修改范围：** `apps/server/src/realtime/websocket.ts`、`apps/server/tests/websocket-market.integration.test.ts`、`apps/web/src/services/realtime.ts`、`apps/web/src/services/realtime.test.ts`、`apps/web/src/stores/trading.ts`，中型，5 个文件。

**是否适用 TDD：** 是；先定义事件协议与关闭行为测试。

## [x] T16：交付私有交易事件与用户隔离

**任务目标：** 在交易事务提交后向相关用户推送订单、持仓和成交事件，禁止跨用户泄露。

**依赖项：** T15。

**验收条件：**
- [x] WebSocket 使用同源 Cookie 鉴权，无效会话被拒绝。
- [x] 相关买卖双方收到私有事件，第三方和对手方不会收到不属于自己的私有载荷。
- [x] 前端按事件更新，并继续以快照为权威。

**RED 阶段的预期失败：** 两用户加第三方连接的隔离测试因私有路由不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/websocket-private.integration.test.ts`

**完成后的回归验证：** `npm run test:integration && npm run test:unit`

**预计修改范围：** `apps/server/src/realtime/user-channels.ts`、`apps/server/src/modules/trading.ts`、`apps/server/tests/websocket-private.integration.test.ts`、`apps/web/src/services/realtime.ts`、`apps/web/src/stores/trading.ts`，中型，5 个文件。

**是否适用 TDD：** 是；身份隔离必须由负向集成测试先固定。

## [x] T17：完成双用户 REST/WebSocket 集成矩阵

**任务目标：** 在独立应用实例中验证注册初始快照、交叉委托、成交结算、实时事件及身份隔离。

**依赖项：** T16。

**验收条件：**
- [x] 卖方使用初始 1,000 股挂单，买方使用初始现金提交交叉单并成交。
- [x] REST 快照与 WebSocket 事件最终状态一致。
- [x] 现金和股票守恒、平均成本可复现、私有数据无泄露。

**RED 阶段的预期失败：** 端到端服务器集成场景暴露任何跨模块接线、顺序或守恒缺口。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/server vitest -- run tests/trading-realtime.integration.test.ts`

**完成后的回归验证：** `npm test && npm run test:coverage`

**预计修改范围：** `apps/server/tests/trading-realtime.integration.test.ts`、`apps/server/tests/fixtures/users.ts`、`apps/server/tests/fixtures/websocket-client.ts`，中型，3 个文件。

**是否适用 TDD：** 是；集成矩阵先失败，再修复最小接线问题。

### 检查点 D1：实时隔离

- [x] 行情公共事件和交易私有事件边界明确。
- [x] 双用户 REST/WebSocket 状态一致且第三方不接收私有数据。
- [x] 服务关闭与连接断开不遗留监听器。

## [x] T18：实现断线重连与权威快照恢复

**任务目标：** 实现单重连循环、指数退避、连接世代、快照期间事件缓冲和鉴权失效退出。

**依赖项：** T09、T15、T16、T17。

**验收条件：**
- [x] 临时断开后自动重连且始终只有一个活动连接。
- [x] 重连快照覆盖断线缺口，旧连接与旧请求不能覆盖新状态。
- [x] 退出或 `401` 停止重连并清除私有状态。

**RED 阶段的预期失败：** 假时钟下的重连、世代和缓冲测试因恢复控制器不存在而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/web vitest -- run src/services/reconnect.test.ts`

**完成后的回归验证：** `npm run test:unit && npm run test:integration`

**预计修改范围：** `apps/web/src/services/reconnect.ts`、`apps/web/src/services/reconnect.test.ts`、`apps/web/src/services/realtime.ts`、`apps/web/src/stores/trading.ts`、`apps/web/src/App.vue`，中型，5 个文件。

**是否适用 TDD：** 是；竞态行为必须以假时钟和连接替身先测试。

## [x] T19：完善错误、空态、键盘与窄屏体验

**任务目标：** 让核心交易流程在失败、空数据、连接中断和 390px 视口下仍清晰可用。

**依赖项：** T14、T18。

**验收条件：**
- [x] 加载、空态、API 错误和离线状态均有非误导提示。
- [x] 表单标签、焦点顺序和键盘提交可用，涨跌不只依赖颜色。
- [x] 390px 宽度下关键控件无遮挡或横向溢出。

**RED 阶段的预期失败：** 可访问性和响应式组件测试因标签、状态或布局规则缺失而失败。

**GREEN 阶段的验证命令：** `npm exec --workspace @stock-trading/web vitest -- run src/App.test.ts`

**完成后的回归验证：** `npm test && npm run build`

**预计修改范围：** `apps/web/src/App.vue`、`apps/web/src/styles.css`、`apps/web/src/components/ConnectionStatus.vue`、`apps/web/src/components/ErrorNotice.vue`、`apps/web/src/App.test.ts`，中型，5 个文件。

**是否适用 TDD：** 是；状态呈现与可访问语义可由组件测试驱动，视觉细节另由浏览器验收确认。

### 检查点 D2：实时交易闭环

- [x] 双用户 REST/WebSocket 状态一致且隔离。
- [x] 断线重连恢复全部委托、持仓和成交。
- [x] 桌面与窄屏核心流程可操作。

## 阶段四：生产运行与浏览器验收

## [x] T20：建立生产构建、静态入口与单进程运行

**任务目标：** 让 `npm run build && npm start` 通过单一地址提供前端、REST、WebSocket 和健康检查。

**依赖项：** T14、T19。

**验收条件：**
- [x] 构建顺序正确并生成可运行产物。
- [x] Express 提供 SPA 静态回退但不吞掉 `/api` 或 `/ws`。
- [x] 本地 HTTP 下会话可用，Cookie 的 `Secure` 仅在实际 HTTPS 配置启用。

**RED 阶段的预期失败：** 生产烟雾测试因构建产物、静态路径或 Cookie 配置不存在而失败。

**GREEN 阶段的验证命令：** `npm run build && npm run test:production`

**完成后的回归验证：** `npm test && npm run build`

**预计修改范围：** `apps/web/vite.config.ts`、`apps/server/src/static.ts`、`apps/server/src/config.ts`、`apps/server/tests/production.integration.test.ts`、`package.json`，中型，5 个文件。

**是否适用 TDD：** 部分适用；静态路由和配置用集成测试驱动，构建产物用命令验收。

## [x] T21：建立 Docker 与 Compose 一键运行

**任务目标：** 使用非 root 多阶段镜像运行同一生产拓扑，并提供健康检查。

**依赖项：** T20。

**验收条件：**
- [x] `docker compose up --build` 不依赖宿主 Node.js 即可启动。
- [x] 单一端口提供页面、REST 和 WebSocket，健康检查能识别失败。
- [x] `.dockerignore` 排除开发缓存、Git 元数据和 Secrets。

**RED 阶段的预期失败：** Docker 构建因缺少 `Dockerfile` 与 Compose 配置而失败。

**GREEN 阶段的验证命令：** `docker compose up --build -d && docker compose ps`

**完成后的回归验证：** `docker compose down && npm run build`

**预计修改范围：** `Dockerfile`、`docker-compose.yml`、`.dockerignore`，中型，3 个文件。

**是否适用 TDD：** 否；容器拓扑通过构建、健康检查和烟雾验证验收。

### 检查点 E1：生产运行

- [x] 本地生产构建与单进程运行入口明确。
- [x] Docker 使用同一产物和启动逻辑。
- [x] Cookie、静态路由与健康检查均有验证路径。

## [x] T22：完成双浏览器上下文核心撮合验收

**任务目标：** 使用 Playwright 两个隔离上下文验证注册初始资产、卖单、交叉买单、成交和双方状态。

**依赖项：** T17、T20。

**验收条件：**
- [x] 两用户注册后的快照均显示 100 万现金和确定性种子持仓。
- [x] 卖方用初始持仓挂单，买方用初始现金交叉买入并产生具体成交。
- [x] UI 断言订单状态、冻结/可用持仓、现金、股票守恒和成交记录的具体值。

**RED 阶段的预期失败：** 浏览器流程测试在选择器、状态同步或业务值不完整处失败。

**GREEN 阶段的验证命令：** `npm run test:e2e -- --grep "双用户撮合"`

**完成后的回归验证：** `npm test && npm run test:e2e`

**预计修改范围：** `playwright.config.ts`、`e2e/auth.fixture.ts`、`e2e/trading.spec.ts`、`e2e/helpers/assertions.ts`，中型，4 个文件。

**是否适用 TDD：** 是；先写面向用户结果的失败验收，再补最小可测试接口或选择器。

## [x] T23：完成重连、刷新与窄屏浏览器验收

**任务目标：** 验证断网期间成交、重连快照、刷新恢复、旧事件防护和 390px 视口。

**依赖项：** T18、T21、T22。

**验收条件：**
- [x] 断线期间发生的交易在重连后完整出现且不重复。
- [x] 刷新后会话与服务器权威状态恢复。
- [x] 窄屏核心控件无遮挡，连接状态清晰。

**RED 阶段的预期失败：** 网络切换和窄屏验收在恢复或布局缺口处失败。

**GREEN 阶段的验证命令：** `npm run test:e2e -- --grep "恢复|窄屏"`

**完成后的回归验证：** `npm run test:e2e && npm run build`

**预计修改范围：** `e2e/reconnect.spec.ts`、`e2e/responsive.spec.ts`、`e2e/helpers/network.ts`、`apps/web/src/styles.css`，中型，4 个文件。

**是否适用 TDD：** 是；浏览器验收先暴露恢复和布局问题，再做局部修正。

### 检查点 E2：生产与浏览器验收

- [x] 本地生产模式和 Docker 模式均已真实验证。
- [x] 双浏览器上下文撮合、恢复和窄屏场景均已真实通过。
- [x] 所有自动化命令的最终完整结果留待 T27 记录。

## 阶段五：证据、审查与发布

## [x] T24：编写 README 与架构决策说明

**任务目标：** 提供 3 分钟启动路径、功能说明、验证命令、限制和 2～3 条与实际实现一致的架构决策。

**依赖项：** T21、T23。

**验收条件：**
- [x] README 覆盖本地开发、生产、测试、Docker、内存易失性和故障排查。
- [x] 明确初始现金、种子持仓、总资产、禁止裸卖空及行情不参与撮合。
- [x] 架构决策与实际代码一致，不记录未采用设计。

**RED 阶段的预期失败：** 文档复现检查因 README 或架构说明不存在而失败。

**GREEN 阶段的验证命令：** `npm run docs:check`

**完成后的回归验证：** 按 README 从干净安装执行 `npm install && npm run dev`，结果只在实际执行后记录。

**预计修改范围：** `README.md`、`docs/architecture-decisions.md`、`package.json`，中型，3 个文件。

**是否适用 TDD：** 否；文档通过命令一致性检查和人工复现验收。

## [x] T25：整理真实 Prompt 与验证记录

**任务目标：** 从真实协作记录选取 3～5 条 Prompt，并建立只记录实际命令结果的验证文档。

**依赖项：** T24。

**验收条件：**
- [x] 每条 Prompt 包含场景、问题、AI 建议、人工审查与调整。
- [x] 不含 Secrets、个人信息或虚构对话。
- [x] 验证记录区分待执行、通过和失败，不预填成功。

**RED 阶段的预期失败：** 交付物检查因 `PROMPTS.md` 或验证记录不存在而失败。

**GREEN 阶段的验证命令：** `npm run docs:check`

**完成后的回归验证：** 人工对照本任务真实对话及 `git diff --check`。

**预计修改范围：** `PROMPTS.md`、`docs/verification.md`，小型，2 个文件。

**是否适用 TDD：** 否；这是事实性证据整理，采用来源对照和文档检查。

### 检查点 F1：交付文档

- [x] README 与实际命令、架构和限制一致。
- [x] Prompt 记录可追溯且不含敏感信息。
- [x] 验证记录未预先声称成功。

## [x] T26：执行独立多维代码审查

**任务目标：** 使用独立审查流程检查正确性、安全性、并发/生命周期、测试充分性、可读性和规格一致性。

**依赖项：** T25。

**验收条件：**
- [x] 审查覆盖工作树全部产品代码、测试、构建和文档。
- [x] 每个发现包含位置、严重级别、证据和建议；无发现也明确记录范围。
- [x] P0/P1 或影响验收的发现会新增独立、≤5 文件的修复任务并阻止 T27。

**RED 阶段的预期失败：** 审查开始时 `docs/code-review.md` 不存在，且任何阻断发现视为门禁失败。

**GREEN 阶段的验证命令：** `git diff --check && npm test && npm run build`

**完成后的回归验证：** 复核 `docs/code-review.md` 中所有阻断发现均有关闭证据。

**预计修改范围：** `docs/code-review.md`，小型，1 个文件；修复不并入本任务。

**是否适用 TDD：** 否；这是独立审查任务，发现的问题必须另建 TDD 修复任务。

### [x] T26-R1：补齐退出与 WebSocket 会话撤销

- 目标：提供 UI 退出，并确保被销毁 token 的既有 WebSocket 立即失效。
- 依赖：T26 首轮只读审查。
- 验收：退出 API 被调用、私有状态清空、重连停止；同 token WebSocket 关闭且不再接收事件。
- RED：UI 找不到退出按钮；退出 API 后现有 WebSocket 仍保持打开。
- GREEN：运行 App 与 WebSocket 私有事件聚焦测试。
- 回归：`npm test`。
- 修改范围：`auth.ts`、`websocket.ts`、`App.vue`、`App.test.ts`、`websocket-private.integration.test.ts`，最多 5 个文件。
- TDD：适用。

### [x] T26-R2：校准重连退避契约

- 目标：实现约 500ms 起步、最大 10s和有界随机抖动。
- 依赖：T26 首轮只读审查。
- 验收：假时钟验证延迟、上限和单重连循环。
- RED：现有首次重连需 1,000ms且没有随机源。
- GREEN：运行 `reconnect.test.ts`。
- 回归：`npm run test:unit`。
- 修改范围：`reconnect.ts`、`reconnect.test.ts`，2 个文件。
- TDD：适用。

### [x] T26-R3：严格校验实时事件 DTO

- 目标：安全忽略合法事件名下的错误 data 结构。
- 依赖：T26 首轮只读审查。
- 验收：四类合法 DTO 可解析，缺字段、错类型和错数组结构均返回 `null`。
- RED：当前解析器接受错误结构。
- GREEN：运行 `realtime.test.ts`。
- 回归：`npm run test:unit && npm run typecheck`。
- 修改范围：`realtime.ts`、`realtime.test.ts`，2 个文件。
- TDD：适用。

### [x] T26-R4：阻止无效会话无限重连

- 目标：WebSocket 关闭后识别已失效会话并停止重连。
- 依赖：T26-R1。
- 验收：会话探测 401 时不创建新 socket并调用清理；普通网络失败仍重连。
- RED：关闭事件直接安排重连，无法触发 401 清理。
- GREEN：运行 `reconnect.test.ts`。
- 回归：`npm run test:unit && npm run typecheck`。
- 修改范围：`reconnect.ts`、`reconnect.test.ts`、`App.vue`，3 个文件。
- TDD：适用。

## [x] T27：执行最终质量门禁并记录证据

**任务目标：** 在无阻断审查发现后运行完整静态检查、测试、覆盖率、构建、生产、容器和浏览器验收。

**依赖项：** T26，及其产生的所有修复任务。

**验收条件：**
- [x] lint、类型、单元、集成、覆盖率、构建和 Playwright 均有真实结果。
- [x] 本地生产与 Docker 健康、页面、REST、WebSocket 均有烟雾证据。
- [x] 失败保持失败状态并阻止发布，不得删除或弱化测试。

**RED 阶段的预期失败：** 任一完整验证命令非零退出、覆盖率不足或烟雾检查失败即为门禁失败。

**GREEN 阶段的验证命令：** `npm run lint && npm run typecheck && npm run test:coverage && npm run test:integration && npm run build && npm run test:e2e`

**完成后的回归验证：** `docker compose up --build` 后验证页面、`GET /api/health` 和 WebSocket，再执行 `docker compose down`。

**预计修改范围：** `docs/verification.md`，小型，1 个文件；产品失败必须另建小型修复任务。

**是否适用 TDD：** 否；这是最终验证门禁，不负责实现或合并修复。

### 检查点 F2：审查与质量门禁

- [x] 独立审查无未解决阻断项。
- [x] 全部验证均有真实结果或明确失败记录。
- [x] 任一失败都会阻止发布准备。

## [x] T28：准备 GitHub 发布材料与安全复核

**任务目标：** 在全部验证完成后检查提交范围、远程关系、Secrets 和公开交付清单，但不 push。

**依赖项：** T27。

**验收条件：**
- [x] 工作树只包含预期文件，无 Secrets、缓存、测试产物或个人数据。
- [x] `origin` 仍指向目标仓库，远程历史与本地无冲突。
- [x] README、Prompt、验证证据和发布清单完整，未修改仓库设置。

**RED 阶段的预期失败：** 任一未解释文件、敏感信息、远程冲突或缺失交付物使发布准备失败。

**GREEN 阶段的验证命令：** `git status --short && git diff --check && git remote -v && git fetch origin --prune`

**完成后的回归验证：** 对最终待提交差异执行一次独立审查并核对 `docs/verification.md`。

**预计修改范围：** `docs/release-checklist.md`，小型，1 个文件。

**是否适用 TDD：** 否；这是 Git 与交付安全审查，不改变产品行为。

## [ ] T29：经明确授权后发布 GitHub

**任务目标：** 仅在用户单独明确授权后，以普通提交和普通 push 发布目标仓库并核验公开链接。

**依赖项：** T28、用户明确发布授权。

**验收条件：**
- [ ] 使用正常提交，不强推、不重写历史、不删除远程分支。
- [ ] push 后公开仓库链接可访问且提交 SHA 与本地一致。
- [ ] 不修改可见性、Secrets、Actions 或分支保护。

**RED 阶段的预期失败：** 未获得明确授权、远程历史变化或发布前检查失败时不得执行 push。

**GREEN 阶段的验证命令：** 经授权后执行受审查的 `git push -u origin <approved-branch>`，再只读核验远程 SHA。

**完成后的回归验证：** `git status --short --branch && git ls-remote --heads origin`

**预计修改范围：** Git 提交与远程分支，不修改产品文件。

**是否适用 TDD：** 否；这是受权限约束的外部发布操作。

### 最终检查点

- [x] `AC-01` 至 `AC-15` 和全部模块验收条件均有可追溯证据。
- [x] 独立代码审查没有未解决阻断发现。
- [x] GitHub 发布只在 T27 完整验证和 T28 发布准备之后进行。
- [x] 计划阶段未把未执行项目提前标记为完成。
