# Agent engineering guide

This guide applies to coding agents working in this repository. Read the relevant spec, implementation, and tests before editing. Write repository documentation in Chinese.

## Four development principles

1. **Think before coding.** State assumptions that affect the implementation. If two interpretations would produce different behavior, illustrate the difference and clarify the intended outcome. If a simpler approach would work, explain its tradeoffs.
2. **Choose the simplest implementation.** Build what the current acceptance criteria require. Introduce a shared interface, configuration option, or dependency when a concrete use case justifies it. Before submitting, simplify branches that existing logic already covers.
3. **Make focused changes.** Each edit should serve the task and follow local naming, structure, and formatting. Remove imports, variables, and functions your change makes obsolete. Record unrelated issues for a separate change.
4. **Work toward verifiable outcomes.** Express the goal as observable behavior, such as “a quote request with zero weight returns a validation error.” Reproduce a bug before fixing it. For a refactor, run the same tests before and after. Pair each step of a multi-step task with a check, act on the results, and report what you verified and what remains open.

## Knowledge
Please refer to the [knowledge base](docs/knowledge/_INDEX.md) for additional information.

进行架构设计或代码编写时, 凡涉及外部库, 必须先通过知识库取得准确的文档, 确认用法后再实施, 不得凭记忆或猜测直接编码。
