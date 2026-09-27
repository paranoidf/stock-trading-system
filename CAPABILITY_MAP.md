# 能力地图：股票模拟交易系统

> 状态：已于 2026-09-27 经人工审阅确认
>
> 本文件是 `spec-driven-development` 的 Phase 0 产物。用户已确认模块边界、依赖方向、构建顺序，并决定将三项可选加分能力全部纳入本次交付范围。

## 范围判断

本项目需要 capability map。原始需求同时包含多个拥有独立数据、接口和验收条件的能力；其中任一能力都可以单独验证，部分能力也可以在不改写其他能力目标的情况下替换实现。因此不适合用一个不可拆分的单体规格承载。

## 必选能力

| 模块 ID | 职责 | 依赖于 |
|---|---|---|
| `runtime-foundation` | 定义前后端工作区、共享类型、统一开发/测试/构建/启动入口，以及后端静态页面入口 | — |
| `identity-session` | 本地注册、登录、当前用户会话与内存用户数据；每个用户初始拥有 100 万虚拟现金及每支种子股票 1,000 股 | `runtime-foundation` |
| `market-simulation` | 维护至少 3 支股票的代码、名称、最新价和涨跌幅，并每秒产生随机小幅价格波动 | `runtime-foundation` |
| `account-ledger` | 维护用户可用/占用资金、可用/冻结持仓、初始成本和交易导致的账户变更规则 | `identity-session`, `market-simulation` |
| `order-book` | 接收、校验和查询限价买卖委托，维护未成交、部分成交和已成交状态及买卖盘顺序 | `identity-session`, `market-simulation`, `account-ledger` |
| `matching-engine` | 按价格优先、时间优先撮合买卖盘，支持部分成交，生成成交并驱动委托、资金和持仓更新 | `order-book`, `account-ledger` |
| `realtime-sync` | 通过 WebSocket 推送行情变动，以及当前用户的委托、持仓和成交更新 | `market-simulation`, `matching-engine` |
| `trading-web` | 提供登录/注册、行情看板、交易面板、委托列表、持仓列表和最近成交记录界面 | `identity-session`, `market-simulation`, `order-book`, `account-ledger`, `matching-engine`, `realtime-sync` |
| `delivery-evidence` | 提供 `README.md`、功能与启动说明、2～3 条关键架构决策、3～5 条关键 Prompt 记录及公开 GitHub 仓库交付说明 | `runtime-foundation`, `trading-web` |

## 可选加分能力

| 模块 ID | 职责 | 依赖于 |
|---|---|---|
| `containerized-runtime` | 使用 `Dockerfile` 和 `docker-compose.yml` 一键启动前后端 | `runtime-foundation` |
| `matching-test-suite` | 覆盖价格优先、时间优先、部分成交等撮合引擎关键场景 | `matching-engine` |
| `reconnect-recovery` | 实现实时连接自动重连，并在重连后同步最新委托、持仓与成交状态 | `realtime-sync`, `trading-web` |

三项加分能力已全部纳入本次正式交付范围，但不得以牺牲必选能力的正确性和可复现性为代价。

## 依赖方向

依赖只从消费方指向提供方，当前地图不存在循环依赖。模块间具体接口契约将在对应提供方的模块规格中定义，例如：

- `identity-session` 定义用户身份与会话契约；
- `market-simulation` 定义股票与行情事件契约；
- `account-ledger` 定义资金和持仓变更契约；
- `order-book` 定义委托、状态与排序契约；
- `matching-engine` 定义成交结果契约；
- `realtime-sync` 定义实时事件封装、订阅范围与恢复契约。

## 建议构建顺序

1. `runtime-foundation`
2. `identity-session` 与 `market-simulation`
3. `account-ledger`
4. `order-book`
5. `matching-engine`
6. `realtime-sync`
7. `trading-web`
8. `delivery-evidence`
9. `matching-test-suite` 与 `reconnect-recovery`
10. `containerized-runtime`

其中同一层级只表示依赖允许并行，不构成实施计划或并行开发授权。

## 地图覆盖关系

| 原始要求 | 对应模块 |
|---|---|
| 本地模拟登录/注册、内存存储 | `identity-session` |
| 至少 3 支股票及每秒价格波动 | `market-simulation` |
| 限价买入/卖出、委托列表 | `order-book`, `trading-web` |
| 价格优先、时间优先撮合 | `matching-engine` |
| 更新资金与持仓、初始现金 100 万、每支种子股票初始持仓 1,000 股 | `identity-session`, `account-ledger`, `matching-engine` |
| 持仓列表与最近成交记录 | `account-ledger`, `matching-engine`, `trading-web` |
| 静态页面入口与 RESTful API | `runtime-foundation` 及各后端能力模块 |
| 行情与用户交易状态实时推送 | `realtime-sync` |
| README、架构决策、Prompt 记录 | `delivery-evidence` |
| Docker 一键启动 | `containerized-runtime`（可选） |
| 撮合引擎单元测试 | `matching-test-suite`（可选，但规格阶段仍会定义必需的撮合单元测试策略） |
| WebSocket 断线重连与状态恢复 | `reconnect-recovery`（可选） |

## 审阅门禁

Phase 0 门禁已通过：用户已明确确认模块边界合理、依赖方向与构建顺序正确，并将 `matching-test-suite`、`reconnect-recovery`、`containerized-runtime` 全部纳入交付范围。
