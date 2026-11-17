# Tasks

## 1. 会话状态与校验模块

- [x] 1.1 先为旅游总天数的合法范围、非法值拒绝、`sessionStorage` 读取/写入/覆盖和非法存储值降级编写失败的 Vitest 单测；验证：先观察到模块缺失导致的红灯，再完成实现。
- [x] 1.2 实现独立的旅游总天数状态模块，统一提供 1–7 整数校验、当前标签页会话保存、合法值覆盖、非法值不写入和读取返回 `number | null`；验证：Vitest 11 个测试文件、67 个用例通过，且实现只使用 `sessionStorage`。
- [x] 1.3 在 `docs/knowledge/architecture/README.md` 补充旅游总天数的 `sessionStorage` 生命周期、读取校验和 US-09 下游边界；验证：文档中的键语义、会话范围与 `trip-duration-input` Spec 一致。

## 2. 目的地页步进器与用户验收

- [x] 2.1 先新增 `e2e/trip-duration-input.spec.ts` 验收骨架，覆盖默认 1 天、选定按钮守卫、合法输入、1/7 边界、非法输入不覆盖和同标签页刷新恢复；验证：新增用例在生产代码未实现前失败，且失败原因是页面行为缺失。
- [x] 2.2 在 `/cities` 候选列表上方组合现有 Base UI 组件，实现默认 1 天的旅游总天数步进器、步长 1、范围 1–7、空态、可访问标签、选定按钮守卫和边界/非法提示；验证：目标 Playwright E2E 5 个场景通过。
- [x] 2.3 将步进器接入会话状态模块，确保客户端挂载后恢复 `sessionStorage` 值、合法值重填覆盖、非法值保持最后合法值；验证：刷新恢复和非法值保护 E2E 通过，SSR/客户端构建无 hydration 错误。
- [x] 2.4 在景点页按合法总天数渲染横向“第 1 天”到“第 N 天”Tabs，默认激活第 1 天；验证：设置 3 天显示且仅显示 3 个天数项，景点列表保持现有查询口径。

## 3. 下游读取契约与非目标约束

- [x] 3.1 暴露供 US-09 使用的安全读取契约：返回合法 `totalDays` 或 `null`，不返回原始存储字符串；验证：单测覆盖空值、越界、非整数存储值均返回 `null`，合法值返回对应整数。
- [x] 3.2 记录 US-09 的接入约定：缺少合法值时阻止生成并回到 `/cities` 天数输入处，合法值作为按天行程总天数；景点页天数 Tabs 仅作为按天浏览容器，不代表已完成景点分配；验证：契约说明与 `spec.md` 的 AC-3/AC-4 一致，且不新增虚假的行程生成路由。
- [x] 3.3 添加反向验收/审查断言：本 Change 不写服务端、不调用新增保存 API、不使用 `localStorage`、不新增 UI 库或 CI 产品；验证：实现 diff 无 `apps/server` 变更，无 `localStorage` 写入，E2E 仅复用既有查询。

## 4. 集成验证

- [x] 4.1 运行前端单测、类型检查与构建：`npm test -w apps/web`、`npx tsc --noEmit -p apps/web/tsconfig.json`、`npm run build`；验证：命令全部成功且无新增 TypeScript 错误。
- [x] 4.2 运行目标与回归 E2E：目标总天数 E2E 5/5、目的地选择回归 15 passed / 4 skipped；仓库 CI 模式全量 E2E 80 passed。
- [x] 4.3 执行变更范围审查与 OpenSpec 校验：`git diff --check`、`openspec validate add-trip-duration-input --strict`；验证：校验通过，业务改动仅涉及前端与文档。

## Workflow follow-up

- US-09 提供实际行程生成路由后，接入本 Change 的安全读取契约和必填守卫，并补齐 AC-3/AC-4 的完整浏览器 E2E。
- 完成实现与验证后，再进入项目要求的 P4 实现、P5 验证和归档流程。

## Superseded 收口（P5 补录，2026-11-17）

- 上述 US-09 下游接入约定已被 active-trip 架构取代：行程生成读服务端 trip 的 `totalDays`（`trip-planning` spec），前端经 `trip-context` store 读取，不再使用 `sessionStorage` 读取契约；原 follow-up 关闭，不再执行。
- 本 change 的 delta specs 不合并入 Living Spec：`trip-duration-input` capability 不成立；`destination-selection` delta 所述步进器契约已被现行主 spec 的草稿流程（选定城市创建草稿、天数 1–7、行程面板输入）取代。
- 取代后的行为已由 `trip-planning` / `trip-context` / `trip-attractions` / `destination-selection` 现行 Living Spec 覆盖；`e2e/trip-duration-input.spec.ts` 已改写为草稿/行程面板口径并随主干 CI 验证。
