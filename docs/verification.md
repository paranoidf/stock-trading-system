# 验证记录

> 仅记录实际执行结果。尚未执行的验证不得标记为通过。

## 2026-09-28：T01 工作区依赖安装

- 命令：`npm install`
- 首次结果：失败。
- 原始错误摘要：`ERESOLVE unable to resolve dependency tree`；`typescript-eslint@8.70.1` 要求 TypeScript `>=4.8.4 <6.1.0`，原规格版本 `7.0.2` 不兼容。
- 根因：TypeScript 主版本超出 lint 工具当前 peer 范围，不是网络、缓存或业务代码问题。
- 处理：未使用 `--force` 或 `--legacy-peer-deps`；查询 npm 官方注册表后，将 TypeScript 调整为兼容范围内最高稳定版本 `6.0.3`，并同步更新 `SPEC.md`。
- 第二次结果：安装成功，新增 336 个包，审计结果为 0 个漏洞；但 `npm-run-all2@9.0.3` 与 `jsdom@30.1.1` 对当前 Node `24.13.0` 发出 `EBADENGINE`。
- 后续处理：查询 npm 官方注册表，改用支持当前 Node 的 `npm-run-all2@8.0.4` 与 `jsdom@29.1.1`。再次安装成功且审计为 0 个漏洞，但 `@vue/test-utils@2.5.1` 经 `js-beautify@2.0.3` 引入要求更高 Node 的 `nopt`；定位依赖链后固定 `@vue/test-utils@2.4.6`，最终复核待执行。
- 最终结果：通过。`npm query .workspace` 返回 server、web、shared 三个 workspace；`npm install --package-lock-only` 成功；`npm audit --audit-level=high` 报告 0 个漏洞。安装仍报告 `glob@10.5.0` 的上游弃用提示，但审计未发现已知漏洞。

## 2026-09-28：T02 工具链基线

- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm run test:unit`：沙箱内首次因 Vite 创建子进程被拒绝而出现 `spawn EPERM`；以相同命令在获批环境运行后通过，无测试文件时按配置返回 0。
- `npm test`：通过；lint、类型检查、unit 与 integration 测试入口均可执行。

## 2026-09-28：T03 共享契约

- RED：`npm exec --workspace @stock-trading/shared vitest -- run` 失败，明确报告 `Cannot find module '../src/money.js'`。
- GREEN：相同命令通过，1 个测试文件、3 个测试通过。
- 回归：`npm run typecheck`、`npm run test:unit`、`npm run lint` 均通过。
- 结果：金额边界、共享 DTO、三支股票及不可变基准价已固定。

## 2026-09-28：T04 服务器生命周期

- RED：健康检查测试失败，报告 `Cannot find module '../src/app.js'`。
- GREEN：聚焦测试通过，1 个测试文件、1 个测试通过。
- 回归：`npm run typecheck` 与 `npm run test:integration` 通过。
- 结果：应用工厂、健康端点、生命周期清理和进程信号关闭入口已建立。

## 2026-09-28：T05 账户账本

- RED：账本测试失败，报告领域模块不存在。
- GREEN：聚焦测试通过，3 个测试通过。
- 回归：`npm run typecheck` 和 `npm run test:unit` 通过，共 2 个测试文件、6 个测试。
- 结果：100 万初始现金、每支股票 1,000 股、确定性成本、资源冻结与成交结算不变量已建立。

## 2026-09-28：T06 委托簿

- RED：委托簿测试失败，报告模块不存在。
- GREEN：聚焦测试通过，3 个测试通过。
- 回归：类型检查与全部单元测试通过，共 3 个文件、9 个测试。
- 结果：买卖盘价格时间排序、卖单可用持仓冻结、非法输入无副作用已验证。

## 2026-09-28：T07 撮合与结算

- RED：撮合测试失败，报告 `matching-engine` 模块不存在。
- GREEN：聚焦测试通过，3 个测试通过。
- 回归：类型检查与完整单元测试通过，共 4 个文件、12 个测试。
- 结果：价格优先、时间优先、静态挂单价、部分成交和同步结算已实现。

## 2026-09-28：T08 撮合守恒与覆盖率

- RED：首次 `npm run test:coverage` 中测试全部通过，但全局语句 65.56%、分支 70.76%、函数 59.45%、行 70.40%，覆盖率门禁失败。
- GREEN：补充多笔成交、现金与股票守恒、自成交中性、静态买单价、最近成交及总资产测试后，6 个文件、17 个测试通过。
- 覆盖率：语句 90.78%、分支 88.88%、函数 88.23%、行 97.41%，超过当前全局 80% 门槛；领域目录语句 92.85%、行 99.02%。
- 结果：价格时间优先、部分成交、初始资产基线和守恒矩阵已形成。

## 2026-09-28：T09 前端壳与状态容器

- RED：session store 测试失败，报告模块不存在。
- GREEN：聚焦测试通过，1 个测试通过。
- 回归：类型检查与完整单元测试通过，共 6 个文件、17 个测试。
- 结果：Vue 入口、统一 API 错误、权威快照原子替换与基础加载状态已建立。

## 2026-09-28：T10 认证纵向切片

- RED：认证 API 返回 404；AuthPanel 测试缺少组件。前端测试另发现 jsdom 解析位置和 Vue SFC 插件配置问题。
- 根因修复：将 `jsdom` 提升到根测试工具依赖，并在 unit/coverage Vitest 配置显式加载 Vue 插件。
- GREEN：后端认证 3 个测试通过；AuthPanel 组件测试通过。
- 回归：`npm run typecheck` 与 `npm test` 通过；共 7 个单元测试文件 18 个测试、2 个集成文件 4 个测试。
- 结果：注册、登录、Cookie 会话恢复、退出、初始现金和种子持仓响应已贯通。

## 2026-09-28：T11 行情纵向切片

- RED：行情模块与组件不存在，API 返回 404。
- GREEN：行情领域、API 和组件共 3 个聚焦测试通过。
- 调试：首次类型检查发现只读 store 数组不能传给可变 prop；把展示组件契约修正为 `readonly StockQuoteDto[]` 后通过。
- 回归：`npm run typecheck` 与 `npm test` 通过；9 个单元文件 20 个测试、3 个集成文件 5 个测试。
- 结果：三支股票、受限随机波动、REST 查询和行情看板已建立，种子基准价保持不可变。

## 2026-09-28：T12 REST 交易闭环

- RED：双用户交易端点返回 404。
- 调试：首轮实现后卖单返回 400 且类型检查发现订单 DTO 被重复序列化；将 `TradingService.place` 恢复为返回领域订单后，原失败场景通过。
- GREEN：双用户 REST 测试 2 个通过；类型检查、单元和集成测试通过。
- 覆盖率回归：首次分支覆盖率 75.39% 未过门禁；补充认证边界、资源不足、查询端点和行情生命周期测试后，13 个文件 28 个测试通过，语句 95.62%、分支 81.74%、函数 97.82%、行 99.23%。
- 结果：下单、撮合、订单、账户、成交和权威快照 REST 已贯通并保持身份隔离。

## 2026-09-28：T13 交易表单与委托列表

- RED：交易 store 与 TradeTicket 组件模块不存在。
- GREEN：聚焦的 store 和组件测试 2 个通过。
- 回归：类型检查与 `npm test` 通过；11 个单元文件 23 个测试、4 个集成文件 7 个测试。
- 结果：限价单表单、重复提交保护、统一错误展示、下单后权威快照刷新与委托列表已接入。

## 2026-09-28：T14 资金、持仓与成交视图

- RED：`PortfolioPanel` 与 `TradeHistory` 聚焦测试失败，报告组件模块不存在。
- 调试：实现后类型检查发现只读 store 状态不能赋给可变 DTO 数组；将共享快照与资产组合的数组契约修正为 `readonly`，保持状态容器不可变约束。
- GREEN：两个聚焦组件测试通过。
- 回归：`npm run typecheck` 与 `npm test` 通过；13 个单元测试文件 25 个测试、4 个集成测试文件 7 个测试。
- 结果：初始现金、可用/占用现金、总资产、总/可用/冻结持仓、平均成本和最近成交均已接入前端展示。

## 2026-09-28：T15 公共行情 WebSocket

- RED：根目录聚焦测试失败；服务器报告 `runtime.attachRealtime is not a function`，前端报告 `realtime` 模块不存在。首次使用 workspace 工作目录与根配置的组合未发现测试文件，已判定为无效执行且未作为 RED 证据。
- GREEN：服务器 WebSocket 行情测试 1 个通过，前端实时服务测试 2 个通过，类型检查通过。
- 回归：`npm test` 通过；14 个单元测试文件 27 个测试、5 个集成测试文件 8 个测试。
- 结果：`/ws` 进行 Cookie 会话鉴权，推送版本化 `market.updated`，前端安全忽略非法载荷，关闭时释放订阅与连接。

## 2026-09-28：T16 私有交易事件与隔离

- RED：买方提交交叉订单后，买方与卖方 WebSocket 事件列表均为空，私有事件断言失败。
- GREEN：聚焦隔离测试通过；双方收到各自的 `order.updated`、`portfolio.updated` 和 `trade.created`，第三方未收到私有事件。
- 回归：`npm test` 通过；14 个单元测试文件 27 个测试、6 个集成测试文件 9 个测试。
- 结果：交易提交后按用户频道推送私有 DTO，实时传输异常不回滚已提交交易，事件载荷不暴露用户标识或对手方账户数据。

## 2026-09-28：T17 双用户 REST/WebSocket 集成矩阵

- 首次执行：聚焦测试直接通过，未发现新的跨模块接线缺口；本任务只新增集成验证，没有新增产品行为，因此没有制造人为失败。
- 验证：1 个集成场景通过，类型检查通过。
- 结果：两个新账户均具有 100 万现金和确定性种子持仓；卖方 10 股与买方交叉单按静态卖单价成交，REST 与 WebSocket 资产一致，双方现金合计与 AAPL 总量守恒。

## 2026-09-28：T18 断线重连与权威快照

- RED：聚焦测试失败，报告 `reconnect` 模块不存在。
- 调试：首轮实现后 401 测试在 Promise 拒绝链完成前断言；保留原行为断言并等待完整 `.then(...).catch(...)` 微任务链后通过。
- GREEN：假时钟下 3 个重连测试通过，覆盖单重连定时器、指数退避起点、连接世代、事件缓冲和 401 停止。
- 回归：类型检查与 `npm test` 通过；15 个单元测试文件 30 个测试、7 个集成测试文件 10 个测试。
- 结果：重连打开后先应用权威快照，再回放当前世代缓冲事件；旧连接和旧请求不会覆盖新状态，认证失效会停止并清理会话。

## 2026-09-28：T19 错误、空态、键盘与窄屏体验

- 首次无效 RED：App 测试因未声明 jsdom 报告 `document is not defined`，该结果未作为产品行为证据。
- RED：补齐测试环境后，应用仍显示内部状态值 `connecting`，未显示预期中文连接状态。
- GREEN：App 聚焦测试 1 个通过；连接状态、委托空态、成交空态和表单标题关联均满足断言。
- 回归：`npm test` 通过；16 个单元测试文件 31 个测试、7 个集成测试文件 10 个测试。
- 结果：认证表单支持 Enter 登录，交易表单具备可访问标题，焦点可见；连接状态中文化，表格可横向滚动，720px 以下布局收敛为单列并适配 390px 视口。

## 2026-09-28：T20 生产构建与单进程运行

- RED：生产集成测试首先以 404 暴露 SPA 回退缺失，并确认 `secureCookies: true` 未生效。
- 调试一：初次 `npm start` 从 workspace 错误解析 `dist` 路径，报告 `MODULE_NOT_FOUND`；将入口改为相对 `apps/server` 的 `../../dist/...`。
- 调试二：再次启动时共享包仍指向 TypeScript 源入口，Node 无法解析源码中的 `.js` 相对导入；为共享包增加开发/类型/生产条件导出，并让构建与开发先生成共享运行时。
- GREEN：生产路由测试 2 个通过，`npm run build` 成功，Vite 生成 75.04 kB JavaScript 与 2.19 kB CSS，`npm run test:production` 通过。
- 真实运行：以 `NODE_ENV=production PORT=3100 npm start` 启动成功；`GET /api/health` 返回 `ok`，`GET /` 返回 200 且包含产品标题，随后人工终止本地进程。
- 结果：单一生产进程提供 SPA、REST 和 WebSocket；未知 `/api` 不回退到 SPA，Cookie 仅在明确配置时启用 `Secure`。

## 2026-09-28：T22 双浏览器上下文撮合验收

- 首次环境失败：应用成功构建和启动，但 Chromium 可执行文件不存在，Playwright 在启动浏览器前失败；安装锁定版本 Chromium 153、Headless Shell 与 FFmpeg 后继续。
- 首次场景失败：可访问选择器 `getByLabel('限价')` 同时命中 form 与 input；收紧为 exact 后保留全部业务断言。
- GREEN：`npm run test:e2e -- --grep "双用户撮合"` 通过，1 个测试耗时 27.0 秒。
- 真实浏览器结果：两个隔离上下文分别注册；双方初始现金为 100 万且 AAPL 为 1,000 股；卖方以 100.00 卖出 10 股，买方以 101.00 交叉买入，成交价 100.00；最终现金分别为 1,001,000.00 与 999,000.00，AAPL 分别为 990 与 1,010 股。
- 证据：`output/playwright/seller-final.png`、`output/playwright/buyer-final.png`；失败运行的 trace 和截图保存在忽略提交的 `output/playwright/test-results`。

## 2026-09-28：T21 Docker 与 Compose

- RED：`docker compose config` 首次报告未找到配置文件。
- 配置修复：增加非 root、多阶段 `Dockerfile`、Compose 健康检查和 `.dockerignore`；中文仓库目录使 Compose 自动项目名为空，显式设置 `name: stock-trading-system` 后 `docker compose config` 通过。
- 宿主阻塞：`docker compose up --build -d` 无法连接 `dockerDesktopLinuxEngine`。启动 Docker Desktop 后，`docker info` 仍持续阻塞；宿主日志显示后端在初始化 Inference manager 时因本地 `dockerInference` socket 无法访问而崩溃，随后关闭全部引擎。
- 恢复：用户重建 Docker 临时运行目录并重新启动 Docker Desktop 后，`docker info` 返回完整 Server 信息，Docker Desktop 29.3.1 与 WSL2 引擎恢复。
- GREEN：`docker compose up --build -d` 成功；镜像内 `npm ci` 审计为 0 个漏洞，三 workspace 构建通过，容器状态为 `healthy`。
- 容器烟雾：`npm run test:container-smoke` 实际验证页面 200、健康端点 `ok`、注册 201 和版本化 `market.updated` WebSocket 事件。
- 非 root：`docker compose exec -T app id` 返回 `uid=1000(node) gid=1000(node)`。
- 清理：`docker compose down` 成功移除容器和网络，`docker compose ps` 返回空列表。
- 结果：通过。Docker 使用与本地生产一致的构建产物、入口、端口与健康检查。

## 2026-09-28：T23 重连、刷新与窄屏浏览器验收

- RED：恢复场景的“买入”选择器同时命中委托行和成交行；窄屏场景把规格要求的首屏未登录 401 探测误记为意外 console error。
- 修正：将订单断言限定在“我的委托”区域，并只豁免这条预期 401；页面异常、其他 console error 和 5xx 仍会使验收失败。
- GREEN：`npm run test:e2e -- --grep "恢复|窄屏"` 两个场景通过，耗时 27.1 秒。
- 完整回归：`npm run test:e2e` 三个场景全部通过，耗时 27.4 秒；随后 `npm run build` 通过。
- 真实浏览器结果：卖方离线期间买方完成成交，卖方恢复网络后通过权威快照看到已成交订单和成交记录；刷新后 Cookie 会话与状态保持；390px 页面无页面级横向溢出。
- 证据：`output/playwright/reconnect-final.png`、`output/playwright/mobile-390.png`。

## 2026-09-28：T24 README 与架构决策

- RED：`npm run docs:check` 首次失败，报告 `scripts/check-docs.mjs` 不存在。
- 调试：检查器随后发现 README 漏列 `npm run test:production`，以及内存限制说明未使用约定短语；补齐命令与“进程重启后”限制后复跑。
- GREEN：`npm run docs:check` 通过，验证 7 个必需文件和 12 个命令入口；`git diff --check` 通过，仅有 Windows 行尾转换提示。
- 结果：README 覆盖开发、生产、Docker、测试、交易规则、故障排查和已知限制；4 条架构决策均与实际实现一致。

## 2026-09-28：T25 Prompt 与验证记录

- RED：文档检查器加入 `PROMPTS.md` 后，`npm run docs:check` 以 `ENOENT` 失败。
- GREEN：从本任务真实输入整理 5 条记录后，`npm run docs:check` 通过，验证 8 个必需文件和 12 个命令入口；`git diff --check` 通过。
- 结果：Prompt 记录包含场景、用户问题、AI 建议与真实人工调整，不含 Secrets、个人凭据或虚构确认；验证记录继续区分通过、失败和曾经的阻塞。

## 2026-09-28：T26 独立代码审查与修复

- 首轮审查：发现 4 个 Required 项——缺少 UI 退出及 token 级 WebSocket 撤销、重连参数偏离规格、实时 DTO 结构校验不足、WebSocket 握手 401 导致无限重连。
- T26-R1 RED/GREEN：退出按钮不存在且销毁 session 后连接 100ms 内未关闭；修复后 App 2 个测试、WebSocket 私有测试 2 个测试通过，类型检查通过。
- T26-R2 RED/GREEN：首次 500ms 重连和延迟计算测试失败；实现 500ms 起步、10s 上限、正负 10% 抖动后 4 个测试通过。
- T26-R3 RED/GREEN：`market.updated` 的对象 data 被错误接受；加入四类 DTO 校验后实时服务 2 个测试通过。
- T26-R4 RED/GREEN：关闭后的 401 探测未触发清理；加入 `GET /api/session` 探测后重连控制器 5 个测试通过。
- 调试：完整回归首次被 `.mjs` 缺少 Node globals 的 lint 配置阻止；限定 `scripts/**/*.mjs` 的 Node 24 globals 后解决。
- 复审门禁：`git diff --check`、`npm test`、`npm run build` 均通过；16 个单元测试文件 34 个测试、8 个集成测试文件 13 个测试通过。
- 结论：没有 Critical 或未解决 Required 发现；详细证据见 `docs/code-review.md`。

## 2026-09-28：T27 最终质量门禁

- 首轮失败：47 个测试全部通过，但 branch 覆盖率为 78.65%，低于 80% 门槛。没有降低阈值或排除文件；补充开发/生产与 Secure Cookie 运行时配置分支测试后恢复。
- 覆盖率复跑：25 个测试文件 49 个测试通过；语句 95.51%、分支 80.33%、函数 98.27%、行 99.45%。
- 浏览器失败与根因：新增真实退出断言后页面显示 `Unexpected end of JSON input`；统一 API 客户端错误地对 `204 No Content` 调用 `response.json()`。新增 204 回归测试、最小修复后，原双用户撮合与退出场景通过。
- 修复后完整门禁：`npm run lint`、`npm run typecheck`、`npm run test:coverage`、`npm run test:integration`、`npm run build`、`npm run test:production`、`npm run test:e2e` 全部通过。
- 最终测试数量：覆盖率运行 26 个测试文件 50 个测试通过；集成测试 8 个文件 13 个测试通过；生产测试 1 个文件 2 个测试通过；Playwright 3 个场景通过，耗时 28.3 秒。
- 最终覆盖率：语句 95.51%、分支 80.33%、函数 98.27%、行 99.45%。
- 本地生产烟雾：端口 3100 的页面 200、健康 `ok`、注册 201、WebSocket `market.updated` 通过，随后终止进程。
- 最终 Docker：重新构建镜像成功，容器烟雾验证页面、健康、注册和 WebSocket 通过；运行身份为 `uid=1000(node)`；`docker compose down` 成功。
- 结果：T27 通过，没有待处理测试、构建、生产、Docker 或 Playwright 失败。

## 2026-09-28：T28 GitHub 发布准备与安全复核

- 工作树基线：`git status --short --branch` 在开始 T28 时仅显示 `## master`，没有未提交修改。
- 远程：`origin` 的 fetch/push 地址均为 `https://github.com/paranoidf/stock-trading-system.git`。
- 远程同步：沙箱内首次 `git fetch origin --prune` 因 `.git/FETCH_HEAD` 写权限被拒绝；在获批环境重跑成功。`git remote show origin` 显示 `HEAD branch: (unknown)`，`git ls-remote --heads origin` 无输出，确认远程仍无分支或提交，没有历史冲突。
- 文件范围：`git ls-files` 只包含产品、测试、规格、文档和运行配置；没有被跟踪的 `.env`、私钥、证书、缓存、覆盖率、构建或 Playwright 输出。
- 敏感信息扫描：对 Git 跟踪文件执行私钥、GitHub token 和 AWS access key 常见模式扫描，无匹配结果。
- 忽略规则：确认 `node_modules`、`dist`、`coverage`、`.env`、日志和 Playwright 产物均被排除。
- 发布材料：新增 `docs/release-checklist.md`，建立 `AC-01` 至 `AC-15` 的证据追踪和授权后操作清单；文档检查器将该文件纳入必需交付物。
- 权限边界：未执行 push、发布或部署，未修改仓库可见性、Secrets、Actions 或分支保护；T29 保持未执行并等待单独授权。
