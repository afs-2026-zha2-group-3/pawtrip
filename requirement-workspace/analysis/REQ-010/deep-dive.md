# Deep-dive — REQ-010 输入旅游总天数

- 日期：2026-11-16
- 上游：[`REQ-010`](../../requirements/REQ-010-trip-duration-input.md)
- 方向：在已有 `/cities` 目的地页增加前端会话状态能力；US-09 为下游消费者

## ① 数据契约

| concept | grain | field list | state transitions | source |
|---|---|---|---|---|
| 当前行程总天数 | 浏览器当前标签页会话（单条） | `totalDays: integer`，取值 1–7；存储键建议为 `pawtrip.tripDuration` | 未填写 → 合法值；合法值 → 合法值（重填覆盖）；非法输入 → 保持原值；会话结束 → 清除 | 用户 AC-1/AC-2；仓库 `sessionStorage` 约定 |
| 天数输入校验结果 | `/cities` 输入控件 | 空、整数 1–7、整数越界、非整数/非数字 | 初始空 → 输入态；合法 → 可保存；非法 → 错误提示且不写入 | 用户 AC-2；React 输入边界 |

约束：`sessionStorage` 中的字符串在读取、写入前后都必须转换并验证为 1–7 的整数；未知字符串、JSON 或浮点值均视为未填写/非法，不得直接作为下游天数。

## ② 边界归属

| rule | branch | in / out | rationale |
|---|---|---|---|
| 页面入口 | 已登录且已选定目的地的 `/cities` | in | 用户故事明确“选定目的地后输入” |
| 页面入口 | 未选定目的地 | in（不展示可提交状态） | 先完成目的地选择；不产生天数保存 |
| 数值 | 整数 1–7 | in，保存 | AC-1 合法范围 |
| 数值 | 0、负数、8 及以上整数 | in，提示且不保存 | AC-2 |
| 数值 | 小数、空字符串、非数字 | in，提示且不保存 | 步进器业务值必须为整数 |
| 步进器 | 1 上继续减、7 上继续加 | in，值不越界并提示 | AC-2 |
| 覆盖 | 新合法值替换旧合法值 | in | AC-1 单条、重填覆盖 |
| 非法覆盖 | 非法值替换已有合法值 | in，保留旧值 | 防止错误输入污染下游 |
| 存储 | 当前标签页刷新/重新进入 | in，恢复合法值 | `sessionStorage` 会话语义 |
| 存储 | 新标签页、浏览器重启、登出后重新登录 | out，不承诺恢复 | 用户最新口径是 `sessionStorage` |
| 生成入口 | US-09 读取合法值 | in，读取契约 | AC-3/AC-4 |
| 生成入口 | 当前变更新增 US-09 页面 | out | 保持本需求聚焦输入能力 |

## ③ 跨 REQ 一致性

| capability | per-REQ grain + fields | aligned? | anchor |
|---|---|---|---|
| `destination-selection` | 已选目的地继续使用 `sessionStorage`，新增同页总天数输入，不改变城市选择语义 | yes | `openspec/specs/destination-selection/spec.md` |
| `web-app-shell` | 不新增 Tab、路由或登出清理行为 | yes | `openspec/specs/web-app-shell/spec.md` |
| `frontend-data-fetching` | 不新增服务端查询/Mutation；仅浏览器会话状态 | yes | `docs/knowledge/architecture/README.md` |
| `itinerary-generation` / US-09 | 消费已验证整数 `totalDays`；生成页和算法尚未存在 | deferred | US-09 owner；不阻塞本需求规格 |

## ④ 通知 / 展示契约

| trigger or surface | recipient | content + display fields | channel | cardinality | source |
|---|---|---|---|---|---|
| 已选目的地后的输入区 | 已登录用户 | 标签「旅游总天数」、当前整数值/空态、减号/加号、范围提示「1–7 天」 | `/cities` 目的地确认区域 | 单例 | AC-1；现有目的地确认区域 |
| 越界或非法输入 | 已登录用户 | 错误提示：必须为 1–7 的整数；当前合法值保持不变 | 输入控件下方，`role=alert` 或等效可访问错误 | 单例 | AC-2 |
| 生成前缺少天数 | 已登录用户 | 提示「请先填写旅游总天数」，并提供回到 `/cities` 天数输入处的导航目标 | US-09 入口/守卫，由下游接入 | 单例 | AC-3 |
| 生成读取 | US-09 前端能力 | 经过校验的 `totalDays` 整数 | 共享读取函数/模块契约 | 单例 | AC-4 |

## Probe log

- 2026-11-16：用户确认存储使用 `sessionStorage`，移除服务端按账号持久化目标。
- 2026-11-16：用户故事仍要求 US-09 按天生成；当前仓库没有生成路由，因此定义为下游接入，不在本需求新增页面。
- 2026-11-16：沿用现有目的地选择的浏览器会话状态模式；总天数使用独立键，避免与 `pawtrip.selectedDestination` 的生命周期耦合。

## DoR ⑨–⑫ 复检

- ⑨ 数据契约：总天数与校验结果均有粒度、字段和状态转换；通过。
- ⑩ 边界枚举：已覆盖无目的地、空值、合法整数、越界、非整数、边界步进、覆盖、刷新与会话结束；通过。
- ⑪ 跨 REQ：目的地页和应用外壳复用既有契约；US-09 明确为下游 deferred，不产生当前变更内冲突；通过。
- ⑫ 展示契约：输入区、错误提示、生成前守卫和下游读取均已定义触发、受众、字段、渠道、基数；通过。

BLOCKER 数：0。
