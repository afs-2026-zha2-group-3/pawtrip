# Requirement registry

| id | title | status | openspec change | notes |
|---|---|---|---|---|
| REQ-001 | Hello World 首页全链路 | Archived | `archive/2026-11-13-hello-world-greeting` | PR #2 已合并(`b55ec39`);G2 Pass(VL=Echo Luo);G3 Pass(SA=Echo Luo);Living Spec 已合并,KB update 为文档化 SKIP |
| REQ-002 | 数据访问、请求与错误处理规范化改造 | Archived | `archive/2026-11-13-refactor-data-access-and-query` | 原 JPA/Query + 扩围的 Problem Details/request 层均已实现;G1 Revision 2 Pass、G2 Pass(IO/SA=Echo Luo)、G3 Pass(SA=Echo Luo);PR #4(`38ca56b`)、#5(`72a36e7`)、#6(归档) 已合并;4 个 Living Spec 已合并;KB update 文档化 SKIP |
| REQ-003 | 用户登录与会话保护 | Archived | `archive/2026-11-13-add-user-login` | Spring Security 服务端会话;数据库用户表 + 脚本注入测试账号;保护 `/api/**`;前端 `/login`、路由守卫与登出;G1 Pass、G2 Pass(VL=Echo Luo)、G3 Pass(SA=Echo Luo);PR #7(`b0c01bd`)、#8(`907c143`) 已合并;2 个新增 + 4 个既有 Living Spec 已合并;KB update 文档化 SKIP |
| REQ-004 | shadcn/ui（Base UI）前端骨架与 Home/Paws 导航 | Archived | `archive/2026-11-13-refactor-web-ui-with-shadcn` | P1–P3 完成并 G1 Pass(IO/SA=Echo Luo);技术基座为 shadcn + Base UI(base-nova);G2 Pass(IO/SA/VL=Echo Luo)、G3 Pass(SA=Echo Luo);PR #10(`fb106ca`)、#11(`0f84657`,归档) 已合并;3 个 Living Spec 已合并;KB update 文档化 SKIP |
| REQ-005 | 管理员维护地点宠物政策 | Archived | `openspec/changes/archive/2026-11-16-admin-edit-location-pet-policies` | 两个现有地点弹窗可编辑 6 项政策;费用按元输入、存储为分;所有地点类型;P1–P3 Pass;G1 Pass(IO=SUKI,SA=RANLE);G2 Pass(VL=RANLE);G3 Pass(SA=RANLE);PR #37(`dcb4690`) 与归档 PR #38(`2783814`) 已合并;本地验证 Pass(后端 80/前端 18/e2e 11);CI 全绿 |

> 登记缺口：`2026-11-14-add-playwright-e2e`、`2026-11-15-add-amap-poi-search`、`2026-11-16-admin-location-management`、`2026-11-16-add-pet-entry-policies` 已归档但未在本表登记；后续补登时需单独确认编号，不得直接复用 REQ-005。
