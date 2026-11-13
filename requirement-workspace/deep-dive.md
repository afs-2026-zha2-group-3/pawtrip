# Deep-dive — REQ-001 Hello World 首页全链路

- 生成日期:2026-11-13
- 触发原因:impact 方向为 **add**(新增 `greeting-store`、`greeting-api`,修改前端首页与代理)
- 上游:[impact-brief.md](impact-brief.md)

## ① Data contract

| concept | grain | field list | state transitions | source |
|---|---|---|---|---|
| Greeting(站点问候语) | 单条记录(one row),代表当前站点问候;本 change 不引入多语言或多问候 | `id` INTEGER PRIMARY KEY;`message` TEXT NOT NULL | 无(只读;由迁移一次性写入) | REQ-001 S1;Flyway V1 |

说明:OQ-3(是否增加字段)保持 `deferred`;本 change 按最小两列实现,新增字段属于后续变更。

## ② Boundary attribution

| rule | branch | in / out | rationale |
|---|---|---|---|
| 读取问候语 | 迁移已执行且存在一条记录 | in | 返回该记录的 `message` |
| 读取问候语 | 表中无记录或存在多条 | out | 由迁移保证单条;异常数据处理不在本次范围 |
| 读取问候语 | 数据库不可用 / 查询失败 | out | OQ-2 已 deferred,本次仅验收正常路径 |
| 请求方法 | 非 `GET /api/greeting` | out | 由 Web 框架默认处理,不在本次定义 |
| 入参完整性 | 无请求参数 | N/A | 接口无输入,不存在缺失字段/格式校验分支 |

## ③ Cross-REQ consistency

| capability | per-REQ grain + fields | aligned? | anchor REQ if not |
|---|---|---|---|
| greeting | REQ-001:单条记录;`id`、`message` | 是(当前仅 REQ-001) | — |

## ④ Notification / display contract

| trigger or surface | recipient role | content + display fields | channel | cardinality behavior | source |
|---|---|---|---|---|---|
| 首页 `/` 加载完成 | 访客 | `greeting.message` 文本,仅展示该文本 | Web 页面 | 单条 | REQ-001 S3 |

## Probe log

| 项 | 结论 | 依据 |
|---|---|---|
| 数据粒度与字段 | 单条记录,`id` + `message` | 需求“a greeting table with one record”;OQ-3 deferred,按最小实现 |
| 边界分支 | 正常路径 in;缺失/异常/非 GET out | 需求非目标与 OQ-2 |
| 跨 REQ 冲突 | 无 | 当前仅一个需求条目 |
| 展示契约 | 首页仅展示接口返回文本 | explore 阶段用户确认“替换为最小页” |

## DoR ⑨–⑫ 复核

| 项 | 结果 |
|---|---|
| ⑨ Data contract decided | 通过(① 已给出 grain、字段与无状态迁移) |
| ⑩ Boundary enumerated | 通过(② 覆盖规则分支;入参完整性为 N/A 且有理由) |
| ⑪ Cross-REQ aligned | 通过(仅 REQ-001,无冲突) |
| ⑫ Notification / display decided | 通过(④ 明确触发、对象、字段与渠道) |

BLOCKER 数:0。
