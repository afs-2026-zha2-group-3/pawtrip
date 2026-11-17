# Delta Spec AC/DoV 复核 — add-intra-city-transport-estimate

- 日期：2026-11-17（/sdd:delta-craft step=all；generate 已在 P2 完成，本次为 review）
- **Revision 2**：2026-11-17 第 5 轮「大交通自驾联动」修订（G1 Pass 后新增需求）同步全部工件后复核；G1 需 Revision 2 人工重签。
- 复核对象：`specs/trip-route-estimate/spec.md`（ADDED，3 需求 12 场景，契约不变仅 Purpose 注明驾车时长复用）、`specs/trip-context/spec.md`（ADDED，8 需求 36 场景，新增「大交通自驾联动」7 场景 + 既有需求条件化）、`specs/trip-planning/spec.md`（MODIFIED「Plan JSON v1 结构」全量块，10 场景，新增 `self_drive` 枚举往返场景）
- 校验证据：`openspec validate add-intra-city-transport-estimate --strict` 通过（2026-11-17，五轮修订后复验）
- 需求来源：`requirement-workspace/requirements/REQ-011-intra-city-transport.md`（S1–S14，DoR BLOCKER=0）

## AC 检查

| 项 | 结果 | 证据 | 备注 |
|---|---|---|---|
| AC-1 每个需求至少一条可测 AC | Pass | 3 个 delta 共 12 个需求块，每块 ≥1 个 `#### Scenario`（最少 1，最多 7） | 无空需求 |
| AC-2 AC 可观察 | Pass | 具体状态码/错误码（401 UNAUTHENTICATED、404 TRIP_NOT_FOUND、400 VALIDATION_ERROR、502 UPSTREAM_FAILURE 见 design D3）、具体数值（taxi_cost 50→40/60；61 秒→2 分钟；步行 0/0）、具体位置（首个景点行前、day 标题下、段行内） | 无「运行良好」类模糊表述 |
| AC-3 高风险负向/边界已覆盖 | Pass | 未登录/非本人/参数非法；Key 缺失/上游失败/字段缺失非数值；非法快照（缺字段/负值/非整数/low>high）；空天/单景点/未排期/草稿；同 POI；档案缺失/未超限；存量 transit；默认不写库（含自驾派生驾车默认）；估算失败仅存方式；非法 `toNext`（枚举外值）仍 400；切换大交通不改写已存选择/快照 | 与 deep-dive ② 边界表逐行对应 |
| AC-4 无伪装成 AC 的实现细节/模糊词 | Pass（带注记） | 场景均为行为断言；「约 600ms 防抖整量 PUT」为既有保存链路复用约束（REQ Constraints），非新实现选择 | 提示类文案「语义固定，措辞 P3 统一」为显式延迟项，语义已锁定，不构成模糊 AC |

## DoV 检查

| 项 | 结果 | 证据 | 备注 |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | delta 覆盖 proposal What Changes 全部条目（含第 5 轮自驾联动）；范围外（租车/实时计价/叫车/可携宠筛选/公交算路/破坏性结构变更/新 Tab/大交通选择与交通规则页行为本身）未出现在任何需求块 | 五轮修订（快照落库/打车提示/政策提醒/位置/自驾联动）均已同步 proposal 与 delta，无静默扩围；估算 API 契约不变（驾车时长复用 mode=drive） |
| DoV-2 歧义已列出或解决 | Pass | REQ-011 OQ 全部 resolved/deferred；design OQ：缓存 TTL/staleTime 与文案 → P3；高德 KB 文档 → tasks 1.1（P3 前，DoR WARNING 非 BLOCKER） | 延迟项均有归属任务，不阻塞 G1 |
| DoV-3 IO/SA 残余关注已记录 | Pass（带残余） | 见下「残余风险」 | 需 IO/SA 在 G1 知悉 |
| DoV-4 未声称业务实现完成 | Pass | tasks.md 全部未勾选；本 change 无生产代码改动（git 7999cbd 仅文档/规格） | — |
| DoV-5 需求可追溯 | Pass | 见下追溯表，S1–S14 全覆盖，无孤儿需求块 | trip-planning MODIFIED 块与 living spec 标题精确一致（validate 已校验） |

## 追溯表（REQ-011 S → delta 需求/场景）

| 来源 | delta 归属 |
|---|---|
| S1 按天展示交通段 | trip-context「途内交通段行展示」 |
| S2 打车估算 | trip-route-estimate「途内交通估算查询与访问控制」「估算结果换算」 |
| S3 步行估算 | trip-route-estimate「步行估算成功」场景 |
| S4 公共交通静态提示 | trip-context「公共交通静态提示」（含自驾隐藏场景） |
| S5 方式选择持久化与恢复 | trip-context「途内交通方式选择与快照持久化」+ trip-planning「估算快照往返保留」 |
| S6 估算失败兜底 | trip-context「估算失败兜底」+ trip-route-estimate「高德路线规划调用与失败处理」 |
| S7 单景点天边界 | trip-context「单景点或空天不生成段行」 |
| S8 方式切换重新估算 | trip-context「切换方式重新估算并更新快照」 |
| S9 默认打车展示 | trip-context「未选择时默认打车不写库」（非自驾条件化；自驾派生驾车见 S14） |
| S10 相邻同 POI | trip-context「相邻景点相同提醒」 |
| S11 快照优先与补写 | trip-context「快照优先展示」「估算失败后回填快照」+ trip-planning「toNextEstimate 可省略」 |
| S12 打车携宠提示 | trip-context「打车段携宠提示」（6 场景，含驾车段不展示/自驾切打车展示） |
| S13 每天政策对比提醒 | trip-context「每天宠物政策对比提醒」（7 场景，首个景点行前，两种大交通模式下均不变） |
| S14 大交通自驾联动 | trip-context「大交通自驾联动」（7 场景）+ trip-planning「self_drive 枚举合法且往返保留」+ 既有需求条件化（段行展示/方式选择/公交提示/携宠提示） |
| Constraints plan_json 增量契约 | trip-planning「Plan JSON v1 结构」MODIFIED 全量块（`toNext` 枚举含 `self_drive`） |

## 残余风险（IO/SA 知悉项，非阻塞）

1. **高德 Key 权限/配额未冒烟**（IO）：`taxi_cost` 可用性需真实 Key 验证（tasks 1.2，P3 前）；失败则升级用户决策。
2. **KB 文档缺口**（SA）：路线规划 2.0 参数/返回字段文档待补入 `docs/knowledge/external/`（tasks 1.1，DoR WARNING）。
3. **回滚兼容**（SA）：旧 validator 丢弃 `toNextEstimate`（design Migration）——回滚后方式保留、快照丢失，回填机制可恢复；无数据损坏。
4. **政策缓存懒加载时序**（IO）：提醒依赖 `cache.locations` 异步加载，未加载时跳过不警示（design D8/Risks），首屏可能短暂无提醒。
5. **文案措辞**（IO）：所有提示语义已锁定，最终中文措辞 P3 统一。
6. **self_drive 回滚拒绝**（SA，第 5 轮新增）：回滚后旧 validator 拒绝 `toNext=self_drive` → 下次 PUT 400 → 前端 `restoreFromServer` 回退（design D9/Migration）；重新部署或重选方式可恢复，无数据损坏。

## 结论

- Revision 2 复核：AC 4/4 Pass、DoV 5/5 Pass（含注记），**无阻塞 Fail/Partial**；S1–S14 全追溯。
- 本复核不构成 G1 决策；第 5 轮修订发生于 G1 Pass 之后，**G1 Revision 2 需人工重签**（沿用 REQ-002/REQ-009 先例）：`/sdd:g1-decision-record`。