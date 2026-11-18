# typescript-testing — TypeScript/JavaScript Testing

## Metadata

| Field | Value |
|---|---|
| **ID** | typescript-testing |
| **Category** | testing |
| **Priority** | High |
| **Activation** | auto |
| **Applies To** | all |
| **Stack** | typescript |

## Rule

## E2E Testing

Use **Playwright** as the E2E testing framework for critical user flows.

### E2E 范围与匹配（防止过量生成）

- E2E 只覆盖**跨页面用户旅程**或必须依赖真实浏览器能力（剪贴板、下载、URL/路由）与真实前后端联动的关键流程。
- 每条 E2E 用例必须对应当前变更的**具体验收场景（AC）**，并在用例名或注释中标注；没有对应 AC 就不写 E2E。
- 单组件/单视图内的 UI 行为（条件渲染、禁用态、空态/加载态、元素不存在、视图内交互）用 **vitest + Testing Library 组件测试**覆盖，不得升级为 E2E。
- 数据写入/未写入优先在 **API 层**证明；仅当只能通过完整 UI 路径观察时才用 E2E。
- 布局几何、像素、CSS 类名断言默认不写；除非 AC 明确要求，且只断言粗粒度行为。
- 优先**扩展既有 spec 文件**（`e2e/*.spec.ts`），仅全新功能域才新建 spec；同一 AC 主题合并为一条用例，不按断言拆用例。
- API/组件/UT 已证明的行为不得在 E2E 重复证明；E2E 只补跨层接缝。
- Non-goal 反向校验挂到已规划层级的既有用例上，不为每个 Non-goal 单独新增 E2E。

## Agent Support

- **e2e-runner** - Playwright E2E testing specialist

## Rationale

Stack-specific testing norms for `typescript` keep agent output aligned with the project's chosen stack without duplicating common Rules.

## Verification

| Check | Blocks |
|---|---|
| PR review against this rule when touching `typescript` sources | pr-merge |

## Examples

See Good/Bad (or CORRECT/WRONG) samples in the Rule section when present.

## Exceptions

- None unless recorded in the project decision log / org policy.
