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
