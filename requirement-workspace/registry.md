# Requirement registry

| id | title | status | openspec change | notes |
|---|---|---|---|---|
| REQ-001 | Hello World 首页全链路 | Archived | `archive/2026-11-13-hello-world-greeting` | PR #2 已合并(`b55ec39`);G2 Pass(VL=Echo Luo);G3 Pass(SA=Echo Luo);Living Spec 已合并,KB update 为文档化 SKIP |
| REQ-002 | 数据访问、请求与错误处理规范化改造 | Archived | `archive/2026-11-13-refactor-data-access-and-query` | 原 JPA/Query + 扩围的 Problem Details/request 层均已实现;G1 Revision 2 Pass、G2 Pass(IO/SA=Echo Luo)、G3 Pass(SA=Echo Luo);PR #4(`38ca56b`)、#5(`72a36e7`)、#6(归档) 已合并;4 个 Living Spec 已合并;KB update 文档化 SKIP |
| REQ-003 | 用户登录与会话保护 | Archived | `archive/2026-11-13-add-user-login` | Spring Security 服务端会话;数据库用户表 + 脚本注入测试账号;保护 `/api/**`;前端 `/login`、路由守卫与登出;G1 Pass、G2 Pass(VL=Echo Luo)、G3 Pass(SA=Echo Luo);PR #7(`b0c01bd`)、#8(`907c143`) 已合并;2 个新增 + 4 个既有 Living Spec 已合并;KB update 文档化 SKIP |
| REQ-004 | shadcn/ui（Base UI）前端骨架与 Home/Paws 导航 | Merged | `refactor-web-ui-with-shadcn` | P1–P3 完成并 G1 Pass(IO/SA=Echo Luo);技术基座为 shadcn + Base UI(base-nova);G2 Pass(IO/SA/VL=Echo Luo);PR #10 已合并;CI Web build Pass;待归档 |
