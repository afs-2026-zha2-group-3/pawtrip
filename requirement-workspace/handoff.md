# Handoff — requirement workspace → OpenSpec

- **Workdir path:** `requirement-workspace/` (override if relocated)
- **OpenSpec changes root:** `openspec/changes/`
- **Rule:** Copy or link stabilized requirements into a change package. This
  workdir is never the long-term Living Spec authority (`openspec/specs/`).

| Artifact | Destination | Notes |
|---|---|---|
| `requirements/` entries | `openspec/changes/<id>/` proposal inputs | After `/sdd:pre-spec-req` |
| Ready / analysis packs | change package or archive | Project convention |

## Current mappings

| requirement | change package | status |
|---|---|---|
| REQ-001 | `openspec/changes/archive/2026-11-13-hello-world-greeting/` | G2 Pass;G3 Pass(SA=Echo Luo);已归档,Living Spec 已合并 |
