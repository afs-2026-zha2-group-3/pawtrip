# G1 决策记录：输入旅游总天数

- Change ID：`add-trip-duration-input`
- Gate：G1 Align
- 决策：Pass
- 时间：2026-11-16（Asia/Shanghai）
- IO：Kitty Su
- SA：HARLAN

## 输入材料

- `proposal.md`
- `specs/trip-duration-input/spec.md`
- `specs/destination-selection/spec.md`
- `dov-ac-review.md`
- `design.md`
- `atdd-design.md`
- `tasks.md`
- `alignment-self-check.md`
- `openspec validate add-trip-duration-input --strict`：通过

## 对齐结论

- 本变更限定为前端实现，使用 `sessionStorage` 保存当前浏览器会话中的旅游总天数。
- 总天数限定为 1–7 的整数；非法输入只提示，不覆盖最近一次合法值。
- 行程生成页的下游接入以已保存的合法总天数为准；本变更不新增服务端接口。
- P2 的 Delta Spec、Design、AC/DoV Review 与 P3 的 ATDD Design、Task Plan 已完成且通过对齐检查。
- 当前仓库尚无 US-09 行程生成页面，因此本次 P4 实现前端存储与生成前校验契约，不虚构下游页面。

## 条件与责任人

- 本变更无阻塞条件。
- US-09 下游实现者需读取同一会话总天数，并复用本变更提供的合法性校验。
