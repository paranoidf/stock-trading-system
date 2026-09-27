# GitHub 发布准备清单

## 当前结论

截至 2026-09-28，本地实现、独立代码审查、最终质量门禁和发布前安全复核均已完成。当前分支为 `master`，`origin` 指向 `https://github.com/paranoidf/stock-trading-system.git`。远程仓库尚无 `HEAD` 或分支，因此不存在需要合并的远程提交，也不存在本地与远程历史冲突。

本文件只记录发布准备状态。尚未执行 `git push`，未创建公开链接，也未修改仓库可见性、Secrets、Actions 或分支保护。GitHub 发布必须等待用户单独明确授权。

## 发布内容

- 产品代码：Vue 前端、Express 服务、共享契约、REST API、WebSocket、撮合与账户领域逻辑。
- 运行资产：生产构建、`Dockerfile`、`docker-compose.yml`、健康检查与容器烟雾脚本。
- 质量资产：单元测试、集成测试、生产测试、Playwright 双用户与恢复验收。
- 说明材料：规格、能力图、任务计划、README、架构决定、Prompt 记录、验证记录与代码审查记录。

## 验收条件追踪

| 验收条件 | 发布前证据 | 状态 |
| --- | --- | --- |
| `AC-01` | `auth.integration.test.ts`、双用户 Playwright；验证记录 T10、T17、T22 | 已验证 |
| `AC-02` | `market.integration.test.ts`、`MarketBoard.test.ts`；验证记录 T11 | 已验证 |
| `AC-03` | `market.unit.test.ts`、`websocket-market.integration.test.ts`；验证记录 T11、T15 | 已验证 |
| `AC-04` | 账本、委托簿和交易 API 测试；验证记录 T05、T06、T12 | 已验证 |
| `AC-05` | `matching-engine.unit.test.ts`、`matching-invariants.unit.test.ts`；验证记录 T07、T08 | 已验证 |
| `AC-06` | 账本守恒测试、双用户 REST/WebSocket 测试；验证记录 T08、T17 | 已验证 |
| `AC-07` | 交易 API 与资产、委托、成交组件测试；验证记录 T12 至 T14 | 已验证 |
| `AC-08` | 公共与私有 WebSocket 集成测试；验证记录 T15 至 T17 | 已验证 |
| `AC-09` | 重连单元测试与断网恢复 Playwright；验证记录 T18、T23、T26 | 已验证 |
| `AC-10` | 生产构建、生产测试与本地烟雾；验证记录 T20、T27 | 已验证 |
| `AC-11` | Compose 构建、健康检查、非 root 和容器烟雾；验证记录 T21、T27 | 已验证 |
| `AC-12` | 最终 lint、类型、覆盖率、集成、构建和 Playwright 门禁；验证记录 T27 | 已验证 |
| `AC-13` | `README.md` 与 `npm run docs:check`；验证记录 T24 | 已验证 |
| `AC-14` | `PROMPTS.md` 与文档检查；验证记录 T25 | 已验证 |
| `AC-15` | 本清单、Git 状态和远程核查；发布动作 T29 保持未执行 | 边界已验证，等待授权 |

## 质量门禁摘要

- lint、类型检查、覆盖率、集成测试、构建、生产测试和 Playwright 完整门禁已通过。
- 最终覆盖率为：语句 95.51%、分支 80.33%、函数 98.27%、行 99.45%。
- Playwright 3 个真实浏览器场景通过，包括双用户撮合、断线恢复、刷新恢复和 390px 窄屏。
- 本地生产烟雾覆盖页面、健康端点、注册和 WebSocket。
- Docker Compose 构建及烟雾通过，容器以 `uid=1000(node)` 运行，并已执行 `docker compose down`。
- 独立代码审查的 4 个 Required 项均已修复，没有 Critical 或未解决 Required。

详细命令、失败、修复与真实结果见 `docs/verification.md`；审查发现见 `docs/code-review.md`。

## 安全与仓库复核

- `git status --short --branch` 显示工作树在发布清单变更前为干净状态。
- Git 跟踪文件中没有 `.env`、私钥、证书或常见 GitHub/AWS 凭据模式。
- `.gitignore` 和 `.dockerignore` 排除依赖、构建目录、覆盖率、日志、环境文件及 Playwright 产物。
- `git fetch origin --prune` 已成功执行；`git remote show origin` 显示远程 `HEAD branch: (unknown)`，`git ls-remote --heads origin` 无输出，确认远程尚无分支。
- 没有执行强推、历史重写、远程分支删除或 GitHub 设置修改。

## 获得发布授权后的操作

1. 再次运行 `git fetch origin --prune`、`git status --short --branch` 和 `git ls-remote --heads origin`，确认外部状态未变化。
2. 确认最终提交 SHA 和获批分支；远程仍为空时，使用普通 `git push -u origin master`。
3. 核对远程分支 SHA 与本地一致，并验证公开仓库链接可访问。
4. 记录真实发布命令、结果和链接；不得强推或修改任何仓库设置。

若授权前远程出现新提交或分支，应停止发布并重新检查历史关系，不得直接覆盖。
