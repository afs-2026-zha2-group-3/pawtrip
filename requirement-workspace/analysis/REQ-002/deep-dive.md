# Deep-dive — REQ-002 数据访问与前端请求规范化改造

- 生成日期:2026-11-13
- 触发原因:impact 方向为 **extend / enable-by-config**(替换既有 `greeting` 数据访问与首页取数实现,不改变外部契约)
- 上游:[REQ-002](../../requirements/REQ-002-data-access-orm-and-query.md)
- 影响分析:[impact-brief.md](impact-brief.md)

## ① Data contract

| concept | grain | field list | state transitions | source |
|---|---|---|---|---|
| Greeting(站点问候语) | 单条记录(one row) | `id` INTEGER PRIMARY KEY;`message` TEXT NOT NULL | 无;仍由 Flyway V1 一次性写入,本次不改 schema | REQ-002 Constraints;`openspec/specs/greeting/spec.md` |
| Greeting API 响应 | 单对象 | `message`:string | 无 | REQ-002 S1;`GET /api/greeting` |
| 前端查询缓存键 | `["greeting"]` 单条查询 | 无业务字段;缓存值为 `{ message: string }` | 缓存由 TanStack Query 管理,刷新页面后重建 | REQ-002 S3 |

说明:本次不新增或修改业务字段;`Greeting` 实体映射到既有表,ID 采用数据库生成的 identity 策略,为后续写入预留,但本次不提供写接口。

## ② Boundary attribution

| rule | branch | in / out | rationale |
|---|---|---|---|
| 读取问候语 | 仓库派生查询返回记录 | in | 返回该记录的 `message` |
| 读取问候语 | 表中无记录 | out | 现有实现未定义空表行为;本次不改变可观察行为 |
| 读取问候语 | 数据库不可用 / 查询失败 | out | 既有非目标(REQ-001 OQ-2) |
| 请求方法 | 非 `GET /api/greeting` | out | 由 Web 框架默认处理,不在本次定义 |
| 入参完整性 | 无请求参数 | N/A | 接口无输入,不存在缺失字段/格式校验分支 |
| 前端取数 | 接口返回 `200` 且 JSON 合法 | in | TanStack Query 获取并渲染 `message` |
| 前端取数 | HTTP 非 2xx / 网络失败 | out | 既有非目标;不新增错误 UI |
| 前端取数 | SSR 首屏渲染 | out | 保持客户端取数,避免相对 URL 在服务端请求失败 |
| 数据写入 | 新增 / 修改 / 删除 greeting | out | 本次只替换读取实现;写入并发与策略为后续变更 |

## ③ Cross-REQ consistency

| capability | per-REQ grain + fields | aligned? | anchor REQ if not |
|---|---|---|---|
| greeting | REQ-001:单条记录;`id`、`message`;REQ-002:同一数据契约,仅替换访问实现 | 是 | — |
| home-page | REQ-001:首页展示 `message`;REQ-002:同一展示契约,仅替换取数实现 | 是 | — |
| backend-data-access | REQ-002:Spring Data JPA 仓库,简单查询无裸 SQL;REQ-001 未约束实现方式 | 是(向前兼容) | — |
| frontend-data-fetching | REQ-002:TanStack Query + 集中 query options;REQ-001 未约束实现方式 | 是(向前兼容) | — |

## ④ Notification / display contract

| trigger or surface | recipient role | content + display fields | channel | cardinality behavior | source |
|---|---|---|---|---|---|
| 首页加载完成 | 访客 | `greeting.message` 文本,仅展示该文本 | Web 页面 | 单条 | REQ-002 S3 |
| 首页加载中 | 访客 | 不新增强制占位/骨架;保持现有最小行为 | Web 页面 | 单条 | REQ-001 设计 |
| 首页请求失败 | 访客 | 不新增错误提示/重试 UI | Web 页面 | — | REQ-001 OQ-2(非目标) |

## Probe log

| 项 | 结论 | 依据 |
|---|---|---|
| 数据粒度与字段 | 不变,单条 `id` + `message` | REQ-001 既有契约;本次不改 Flyway |
| 边界分支 | 成功读取/展示 in;空表、失败、SSR、写入 out | REQ-001 非目标与现有设计 |
| 跨 REQ 冲突 | 无;REQ-002 只增加实现约束 | Living Spec `greeting` / `home-page` |
| 展示契约 | 首页仍只展示接口返回的 `message` | REQ-002 S3 |
| 前端缓存语义 | 新查询键 `["greeting"]`;页面刷新重建缓存 | TanStack Query 客户端取数 |

## DoR ⑨–⑫ 复核

| 项 | 结果 |
|---|---|
| ⑨ Data contract decided | 通过(① 明确 grain、字段与无状态变更) |
| ⑩ Boundary enumerated | 通过(② 覆盖读取、空表、失败、SSR、写入分支) |
| ⑪ Cross-REQ aligned | 通过(与 REQ-001 能力一致,无冲突) |
| ⑫ Notification / display decided | 通过(④ 明确首页展示内容、加载与失败态) |

BLOCKER 数:0。
