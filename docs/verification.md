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
