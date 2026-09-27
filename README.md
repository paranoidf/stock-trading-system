# 股票模拟交易系统

这是一个可本地运行的内存态模拟交易系统，使用 Vue、Express、WebSocket 和 TypeScript 实现用户认证、模拟行情、限价委托、价格时间优先撮合、账户结算与实时状态恢复。

## 三分钟启动

环境要求：Node.js 24 或更高版本、npm 11 或更高版本。

```bash
npm install
npm run dev
```

浏览器访问 `http://localhost:5173`。前端开发服务器会把 `/api` 和 `/ws` 代理到 `http://localhost:3000`。

首次使用时注册两个账户。每个账户会获得：

- 初始虚拟现金 `1,000,000.00`；该数值只表示现金，不包含初始持仓市值；
- AAPL、MSFT、NVDA 各 1,000 股可用持仓，冻结持仓为 0；
- 初始平均成本使用固定种子基准价，不受实时随机行情影响。

总资产按“现金 + 当前持仓市值”计算。初始持仓属于账户种子资产，不是撮合成交。行情模拟器只更新行情，不充当交易对手；注册完成后股票只能在用户之间转移。

## 核心交易规则

- 仅支持限价单和整数股数量。
- 买盘价格高者优先，卖盘价格低者优先；同价按服务端稳定序号排序。
- 成交价采用先进入委托簿的静态挂单价。
- 买单提交时冻结限价所需现金；卖单只能使用可用持仓，提交时冻结对应股票。
- 禁止裸卖空；可用现金或可用持仓不足时整笔拒绝。
- 成交支持部分成交和多笔成交，现金与股票同步结算并保持守恒。
- 所有数据保存在进程内存中，进程重启后会清空用户、订单和成交。

## 常用命令

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run test:coverage
npm run test:production
npm run test:e2e
npm run docs:check
npm test
npm run build
```

### 本地生产运行

```bash
npm run build
npm start
```

默认访问 `http://localhost:3000`。同一进程提供前端静态资源、REST API、`/ws` 和 `GET /api/health`。

本地 HTTP 不应启用安全 Cookie。只有在实际 HTTPS 终止配置下才设置：

```bash
COOKIE_SECURE=true npm start
```

Windows PowerShell 可使用：

```powershell
$env:COOKIE_SECURE = "true"
npm start
```

### Docker Compose

```bash
docker compose up --build -d
docker compose ps
npm run test:container-smoke
docker compose down
```

容器以非 root 的 `node` 用户运行，在端口 3000 提供与本地生产模式相同的拓扑和健康检查。

## 测试结构

- 单元测试：金额、种子配置、账本、委托簿、撮合、行情、前端 store、组件和重连竞态。
- 集成测试：认证、初始账户快照、行情、双用户 REST 撮合、WebSocket 鉴权与私有数据隔离、生产静态入口。
- Playwright：两个隔离浏览器上下文的真实撮合、断线期间成交后的权威快照恢复、刷新恢复和 390px 窄屏检查。
- Docker 烟雾：容器页面、健康端点、注册 Cookie 和 WebSocket 行情事件。

真实执行结果记录在 `docs/verification.md`，不能以该文件替代当前环境中的重新验证。

## 项目结构

```text
apps/web/             Vue 前端
apps/server/          Express、领域服务与 WebSocket
packages/shared/      DTO、金额工具与股票种子
e2e/                  Playwright 浏览器验收
docs/                 架构、验证与发布记录
tasks/                已批准计划和执行清单
```

## 故障排查

- `spawn EPERM`：确认终端或安全软件允许 Node.js 创建测试工作进程。
- Playwright 缺少浏览器：运行 `npx playwright install chromium`。
- `docker info` 只有 Client：Docker Desktop 引擎尚未运行；先恢复 Docker Desktop/WSL2，再执行 Compose。
- 端口占用：开发模式需要 3000 和 5173；生产或 Docker 默认需要 3000。
- 登录状态丢失：系统为内存态，服务重启后原 Cookie 对应会话不再存在，需要重新注册或登录。

## 已知限制

- 没有数据库、持久化、取消订单、真实券商或真实行情接入。
- 单进程内存事务不支持横向扩容。
- 不提供管理员后台、充值提现、融资融券或裸卖空。
- 仅用于教学和模拟，不构成投资建议，也不能处理真实资金。

## 设计依据

产品规格见 `SPEC.md` 和各模块 `SPEC-*.md`；模块关系见 `CAPABILITY_MAP.md`；已采用的架构决定见 `docs/architecture-decisions.md`。
