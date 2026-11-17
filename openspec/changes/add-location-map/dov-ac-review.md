# AC / DoV Review — add-location-map

- 日期：2026-11-17
- 审查对象：`openspec/changes/add-location-map/specs/trip-attractions/spec.md`（2 个 ADDED Requirement / 12 个 Scenario）
- 上游：`proposal.md`、`design.md`、`tasks.md`、`requirement-workspace/requirements/REQ-012-nearby-location-filter.md`、GitHub issue #20（US-12）
- 评审状态：Delta Spec 可进入 **G1** 人工评审；本文件不是 G1 决议，不代替 IO/SA 签字

## AC 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| AC-1 每个 requirement 至少一个可测 AC | Pass | “地点地图展示与列表联动”含 7 个 scenario；“地图详情卡片与摘要字段”含 5 个 scenario | 覆盖点位、联动、筛选刷新、降级、详情卡片、接口字段 |
| AC-2 AC 可观察 | Pass | marker/卡片高亮、InfoWindow 内容、占位文案、`photoUrl` 等字段、缺失字段不展示 | 无模糊表述 |
| AC-3 负向/边界覆盖 | Pass | 未配置 Key、SDK 加载失败、缺失照片/评分/商圈、不返回原始 JSON、不伪造押金/清洁费/设施 | 与 `design.md` Non-Goals 一致 |
| AC-4 不把实现细节伪装成 AC | Pass | 约束落在页面行为、接口字段与降级结果；未指定组件名、Loader 实现或安全密钥方案 | 生产代理方案保留为 Open Question |

## DoV 检查

| Item | Result | Evidence | Notes |
|---|---|---|---|
| DoV-1 范围与 proposal 一致 | Pass | proposal 列出地图列、全部点位、marker/卡片联动、InfoWindow 查看详情、摘要字段、无新 schema；Delta 2 个 requirement 对应 | 未包含押金/清洁费/宠物设施字段 |
| DoV-2 歧义已列出或解决 | Pass | `design.md` Open Questions 记录生产代理方案、轻量点位接口、押金/设施字段，均为后续问题 | 不阻塞本期地图主链 |
| DoV-3 IO/SA 残余风险已记录 | Pass | 见下方“残余风险 / G1 关注点” | 含安全密钥与真实地图验证边界 |
| DoV-4 未声称业务实现已完成 | Pass | `tasks.md` 6.5 仍未完成（重启后端确认照片/评分）；本文件不把人工验证当作完整自动化证据 | 实现状态以 tasks 与本地验证报告为准 |
| DoV-5 requirement 可追溯到 proposal/REQ | Pass | 见下方追溯表 | 地图为 REQ-012 的后续扩展，REQ 文档已登记 |

## 追溯表

| Delta requirement | 来源（proposal / REQ-012） |
|---|---|
| 地点地图展示与列表联动 | proposal“右侧地图、全部点位、marker 联动、卡片定位、无 Key 降级”；REQ-012 地图扩展说明 |
| 地图详情卡片与摘要字段 | proposal“InfoWindow 查看详情、首张照片/评分/商圈、共享详情接口摘要字段、缺失不伪造” |

## 残余风险 / G1 关注点

| 级别 | 关注点 | 说明 |
|---|---|---|
| 风险 | 真实地图链路缺自动化 | E2E 强制空 Key，只验证占位；marker 点击、卡片定位、筛选刷新、SDK 加载失败依赖代码审查与有 Key 环境人工验证 |
| 风险 | 地图详情卡片未完成最终确认 | `tasks.md` 6.5 仍待重启后端后确认照片与评分展示；当前有 DOM/网络验证记录，但未闭环 |
| 风险 | 安全密钥进入前端 bundle | 本期用 `VITE_AMAP_SECURITY_CODE` 直连；生产需改为 `serviceHost` 代理并配置域名白名单（design Open Question） |
| 风险 | 地图点位请求数随数据增长 | 前端按 `pageSize=100` 循环取完所有分页；单城单类型数百条可接受，数据增长后需轻量点位接口 |
| 风险 | V22 依赖同名真实 POI | 仅当开发库存在同名真实 POI 时才关联照片/评分 JSON；找不到时卡片不展示对应字段，不伪造 |
| 风险 | 坐标系 | 仅使用高德 GCJ-02 坐标；不混入 WGS84 或用户定位 |
| 已决 | 地图样式精修、聚合、路线规划、定位、导航 | 不在本期范围 |
| 已决 | 押金/清洁费/宠物设施 | 当前数据模型无字段，不作为卡片必需内容；新增字段另开需求 |

## 结论

- AC-1…AC-4：Pass。
- DoV-1…DoV-5：Pass。
- 无阻塞性缺口；Delta Spec 可提交 **G1** 人工评审。
- G1 决议由 IO/SA 作出；本文件不写入 Pass/Fail，也不代替人工签字。
