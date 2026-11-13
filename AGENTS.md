# Agent engineering guide

This guide applies to coding agents working in this repository. Read the relevant spec, implementation, and tests before editing. Write repository documentation in English.

## Four development principles

1. **Think before coding.** State assumptions that affect the implementation. If two interpretations would produce different behavior, illustrate the difference and clarify the intended outcome. If a simpler approach would work, explain its tradeoffs.
2. **Choose the simplest implementation.** Build what the current acceptance criteria require. Introduce a shared interface, configuration option, or dependency when a concrete use case justifies it. Before submitting, simplify branches that existing logic already covers.
3. **Make focused changes.** Each edit should serve the task and follow local naming, structure, and formatting. Remove imports, variables, and functions your change makes obsolete. Record unrelated issues for a separate change.
4. **Work toward verifiable outcomes.** Express the goal as observable behavior, such as “a quote request with zero weight returns a validation error.” Reproduce a bug before fixing it. For a refactor, run the same tests before and after. Pair each step of a multi-step task with a check, act on the results, and report what you verified and what remains open.

## Knowledge
Please refer to the [knowledge base](docs/knowledge/_INDEX.md) for additional information.

## Reference
UI design please refer to [shadcn/ui](https://ui.shadcn.com/docs)

## Pawtrip 项目说明

前后端同仓：`apps/web`（Vite / TanStack Start）与 `apps/server`（Spring Boot / Maven）。

开始改动前，先阅读项目文档：

- [docs/architecture.md](docs/architecture.md) — 技术栈、目录结构、运行时模型、编码约定与常用命令。
- [docs/references.md](docs/references.md) — 三方依赖文档索引、本地技能位置与加载方式。

架构、工具链或依赖发生变化时，同步更新对应文档。不要在本文件中重复文档内容。
