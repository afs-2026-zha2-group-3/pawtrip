# Design

## Context

- 创建行程弹窗的日期状态是 `startDate` / `endDate` 两个 `yyyy-MM-dd` 字符串，天数由 `daysBetween(startDate, endDate)` 含首尾计算，`totalDays` 为 1–7。
- 仓库 UI 目录没有日历组件，也未依赖 `react-day-picker`；现有组件基于 Base UI / shadcn 风格。
- 需求只涉及单月浏览与区间选择，不需要多语言、日期禁用规则或输入框联动。

## Goals / Non-Goals

**Goals:**

- 用一张月历完成开始/结束日期选择，区间可见。
- 保持 `daysBetween` 与 1–7 天校验为唯一事实源。
- 不新增依赖，交互与现有表单、E2E 助手兼容。

**Non-Goals:**

- 不引入 `react-day-picker` / shadcn Calendar。
- 本变更不负责日期持久化（由 `2026-11-17-add-trip-start-date` 承接）、时区处理、日期编辑入口或日历之外的日期展示。
- 不限制过去日期，不提供年份下拉与快速跳月。

## Decisions

### D1：自研轻量 `CalendarRange`，不新增依赖

只渲染单月网格、前后翻月与区间高亮。`react-day-picker` 会带来新依赖与主题适配成本，而本场景只需要其能力的很小一部分。

替代方案：安装 shadcn Calendar（`react-day-picker`），可获得键盘方向键与无障碍能力；本次为单一对话框场景，选择自研并补齐必要的 `aria-label`/`aria-pressed`。

### D2：状态仍用 `yyyy-MM-dd` 字符串，月视图用本地 `Date` 计算

日期值继续是 ISO 字符串，与 `daysBetween` 的 UTC 解析一致；月网格用本地 `new Date(year, monthIndex, day)` 生成日期字符串，避免 UTC 偏移导致跨时区错日。区间判断直接做字符串比较（`yyyy-MM-dd` 定长可比）。

### D3：点击语义

- 无开始日期、已有完整区间、或点击日期早于当前开始日期 → 该日期成为新的开始日期，结束日期清空。
- 否则该日期成为结束日期，与开始日期组成区间。

「早于开始日期」采用重新开始而非交换端点，与常见范围选择器（如 Ant Design RangePicker）一致，也避免用户误点后得到意外区间。

### D4：1–7 天仍由提交时校验

日历不禁止选择超过 7 天的区间，保持原有「提示 + 阻止提交」的行为与错误文案；单日历让「结束早于开始」不可表达，因此删除该错误分支与 E2E 用例，改为覆盖「只选开始日期」与「重新开始选择」。

### D5：可测试性与无障碍标记

- 日历根节点带 `data-slot="calendar-range"` 与 `data-month="yyyy-MM"`，日期按钮带 `data-date="yyyy-MM-dd"`；E2E 据此定位并按目标月份翻月。
- 日期按钮 `aria-label` 为「YYYY年M月D日」，端点 `aria-pressed=true`；月份标题 `aria-live="polite"`。
- 日历按钮全部 `type="button"`，避免触发表单提交。

## Risks / Trade-offs

- **自研日历无方向键导航** → 键盘用户需 Tab 逐个日期；本次场景可接受，若后续出现多处日期选择应改用成熟日历库。
- **跨月区间需要翻月** → 提示文案会显示已选开始日期，用户翻月后仍知道起点；E2E 已覆盖跨月选择。
- **与 `add-trip-start-date` 修改同一组 requirement** → 两份未归档变更都改 `创建行程确认弹窗` / `选定城市与创建行程确认`。本变更只改日期交互，不引入持久化；归档时应先归档本变更，再由 `add-trip-start-date` 叠加 `startDate` 持久化描述。
- **区间色带按列铺满，单月外不可见** → 跨月区间只显示当前月份内的片段，属预期表现。

## Migration Plan

纯前端交互替换，无数据迁移。回滚只需恢复两个原生日期输入与对应测试。

## Test Strategy

- E2E：同日 1 天、3 天区间、超 7 天拒绝、只选开始日期时拒绝、再次点击重新开始、跨月选择、确认后创建行程。
- 单测：`daysBetween` 既有用例继续覆盖含首尾计数；日历本身以 E2E 覆盖交互。
- 浏览器结构验证：区间端点 `aria-pressed`、区间底色、月切换与提示文案。
