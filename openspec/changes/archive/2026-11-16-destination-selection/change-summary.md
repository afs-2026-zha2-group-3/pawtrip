# Change Summary — destination-selection

- 日期：2026-11-16；需求：issue #15（US-47，Must）；登记编号 REQ-006（原 REQ-005，因 main 编号占用改编号）
- Gates：G1 Pass、G2 Pass（IO/SA=HARLAN HUANG，见 g1-decision.md / g2-decision.md）；G3 见 g3-decision.md

## Intent

目的地是行前规划链的第一个决策点：在 `/cities` 提供城市级候选搜索、宠物友好筛选与选定生效，作为后续政策查看（#14）、交通规则对比（#16）与行程规划（#17/#18）的上下文。

## What shipped

- **PR #44**（已合并，`b75c532`）：`GET /api/destinations` 只读候选接口（全部城市级行政区、服务端 keyword/限养数筛选、401 契约、政策字段占位）；`/cities` 搜索/筛选/计数/空态；sessionStorage 选定（登出清除）+ 顶栏 chip；禁养匹配纯函数保留、展示暂缓 TODO；原 V14 政策种子按需求方决定移除
- **PR #49**（已合并，`5d70f2a`）：四层叠加匹配（限养数 AND 类型 AND 品种 AND 肩高；类型 null=不允许，品种空列表/肩高 null=未配置放行）；响应增 `allowedPetTypes`/`allowedDogBreedIds`/`maxSinglePetShoulderHeightCm`；卡片右上角绿/红匹配标签（无档案不显示）；已选定再点取消；档案 adapter 消费 PR #41 的 `dogBreed`（单宠口径）；**V16 全城市种子**（CAT,DOG + 7 非烈性品种含哈士奇）；E2E E17/E18；run-e2e 暴露临时库路径
- Living Spec：`destination-selection` 新建（9 requirements）；`web-app-shell` 更新（+1/~5/→2，含与 REQ-007 交通规则 Tab 的对齐）；Purpose 同步
- 知识库：`docs/knowledge/architecture/README.md` destination 模块与前端选定约定

## Verify highlights

| 项 | 结果 | 证据 |
|---|---|---|
| 后端 | 105/0/0/0（含 destination 12 用例） | `./mvnw clean test` |
| 前端单测 | 54 passed | vitest（apps/web） |
| 类型/规格 | tsc 干净；openspec strict valid | 命令行 |
| E2E | 54 passed + 4 fixme（E4/E6/E10/E11 门控） | Playwright Chromium |
| 本地报告 | Overall Pass（V1–V8） | `docs/ai4se-plugins/20261116-161833-local-verify-report.md` |
| CI | PR #44/#49 均全绿（Web/Server/E2E） | ci-report.md |
| KB update | Skipped（not configured） | `scripts/kb-lint.sh` 输出 SKIP（exit 0），按本仓既有做法非阻塞；不声称 KB lint/索引/一致性已通过 |

## Residual risks

1. 禁养（banned）数据源未定：`policyCovered`/`bannedBreeds` 占位，E4/E6/E10/E11 fixme 门控——数据源确定后恢复（PR #43 在途政策 change 或后续承接）
2. PR #43 仍 OPEN 且带 V15（低于已应用 V16）：建议关闭（已被无迁移的 PR #47 取代）或重编号
3. 多宠口径：当前匹配取第一只宠物（需求方确认单宠）；多宠支持待口径决策
4. CI 无安全扫描作业（治理项）
5. sessionStorage 会话级丢失——需求方接受

## Links

- PR：#44（基础）、#49（增强）；issue #15
- 归档位置：`openspec/changes/archive/2026-11-16-destination-selection/`
- 验证报告：`docs/ai4se-plugins/20261116-143011-local-verify-report.md`（基础）、`20261116-161833`（增强）、`20261116-144147-pipeline-report.md`