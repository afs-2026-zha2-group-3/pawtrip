# REQ-004 Deep-dive

关联需求：[REQ-004](../../requirements/REQ-004-shadcn-ui-shell-and-tabs.md)
影响分析：[impact-brief.md](impact-brief.md)

影响方向为 add / extend，按 Phase 2.5 对四个固定类别进行探测。本需求仅涉及前端 UI 与路由，不新增数据契约。

## ① 数据契约

| concept | grain | field list | state transitions | source |
|---|---|---|---|---|
| 无新增数据概念 | — | — | — | 复用现有 `greeting`，见 `openspec/specs/greeting/spec.md` |

说明：本次不新增实体、字段或状态机；首页仍读取 `/api/greeting` 的 `message`。

## ② 边界归属

| rule | branch | in / out | rationale |
|---|---|---|---|
| Tab 路由映射 | pathname `/` | in | 映射为 `Home`，选中 Home Tab |
| Tab 路由映射 | pathname `/paws` | in | 映射为 `Paws`，选中 Paws Tab |
| Tab 路由映射 | 其他 pathname | out | 交给现有 `notFoundComponent`，不新增 Tab |
| Paws 内容 | `/paws` 任意访问 | out | 本次内容为空 |
| 问候语展示 | 后端可用 | in | `Home` 展示 `message` |
| 问候语展示 | 后端不可用 / 首次加载失败 | in | 进入现有 `errorComponent`，提供重试 |
| 模板 UI | Header / Footer / ThemeToggle / About / Devtools | out | 本次删除 |
| UI 基础 | shadcn/ui（Base UI）组件 | in | 唯一 UI 组件来源 |
| UI 基础 | Radix 版本组件、其他 UI 组件库、手写 CSS 类 | out | 明确禁止 |

## ③ 跨 REQ 一致性

| capability | per-REQ grain + fields | aligned? | anchor REQ if not |
|---|---|---|---|
| `home-page` | 首页展示 `/api/greeting` 的 `message` | yes | — |
| `frontend-data-fetching` | TanStack Query + 集中 query options | yes | — |
| `frontend-api-request` | request 层、typed ApiError、路由级错误页与 404 | yes | — |
| `web-app-shell` | 顶部两 Tab 与路径同步 | n/a（新增） | — |
| `paws-page` | `/paws` 可访问且内容为空 | n/a（新增） | — |
| `ui-foundation` | shadcn/ui（Base UI）、无手写 CSS | n/a（新增） | — |

## ④ 通知 / 展示契约

| surface | trigger | recipient | content + display fields | channel | cardinality | source |
|---|---|---|---|---|---|---|
| 顶部 Tab 导航 | 打开 `/` 或 `/paws` | 访客 | `Home` / `Paws` 标签 + 选中态 | 页面顶部 | 固定 2 个 | REQ-004 |
| Home 内容 | 打开 `/` | 访客 | `greeting.message` | 页面 Card | 1 条 | `openspec/specs/home-page/spec.md` |
| Paws 内容 | 打开 `/paws` | 访客 | 空 | 页面 | 0 | REQ-004 |
| 路由错误页 | 首次加载失败 | 访客 | `ApiError.detail` + 重试按钮 | `errorComponent` | 1 | `openspec/specs/frontend-api-request/spec.md` |
| 404 页 | 未知路由 | 访客 | 固定文案 + 返回首页入口 | `notFoundComponent` | 1 | `openspec/specs/frontend-api-request/spec.md` |

## Probe log

- 2026-11-14：确认 Tab 对应真实路由 `/` 与 `/paws`（需求方）。
- 2026-11-14：确认现有错误页与 404 行为保留，仅替换呈现组件。
- 2026-11-14：确认 Paws 内容为空，不加载数据。
- 2026-11-14：确认不新增数据契约、不调整接口。
- 2026-11-14：确认 shadcn/ui 底层 primitive 使用 Base UI（非 Radix）；组件来自官方 `base-nova` registry。
