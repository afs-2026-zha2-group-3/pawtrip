# Proposal

## Why

行程面板的途内交通段行在行首单独渲染「打车」「步行」纯文字，右侧再放一个并列的方式下拉，同一信息出现两次且占宽。地点被拖拽调整顺序或跨天移动后，被移动 stop 仍保留旧的 `toNext` 与估算快照，该快照对应的是旧的相邻关系，展示出的时长与费用可能不再成立。用户要求：去掉行首的方式文字，把方式下拉移到该位置；被拖拽调整过的地点清空途内交通选择，让用户重新选择。

## What Changes

- 段行布局：方式选择器作为行首元素直接展示当前方式（打车/步行/驾车），移除选择器之前单独的方式文字；时长、费用与加载/失败文案紧随其后，携宠提示仍在下方。
- 拖拽语义：地点被拖动到新位置（同日排序、跨天移动）后，被移动 stop 的 `toNext` 与 `toNextEstimate` 清空，回到按大交通派生的默认方式并重新估算，同时沿用既有防抖保存；其他 stop 已保存的方式与快照保持不变。拖入「未排期」沿用既有语义（不携带途内交通）。
- 只读（行程已结束）时拖拽不产生任何变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `trip-context`：修改「途内交通段行展示」为选择器位于行首、不再单独渲染方式文字；新增「拖拽后重置被移动地点的途内交通」。

## Impact

- **前端**：`apps/web/src/components/trip/transport-segment.tsx`（段行布局）、`apps/web/src/lib/trip/store.ts`（`moveStop` 清空被移动 stop 的 `toNext`/`toNextEstimate`）。
- **测试**：`apps/web/src/lib/trip/store-transport.test.ts`（原「移动保留快照」用例反转为清空并新增其他地点保留用例）、`apps/web/src/components/trip/transport-segment.test.tsx`（方式文字只出现在选择器内）。
- **依赖**：无新增依赖；后端接口与持久化契约不变。
