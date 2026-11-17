import { describe, expect, it } from "vitest";
import {
  actionForTool,
  resolveAgentStatus,
  type AgentMessageLike,
} from "./status";

function assistant(parts: AgentMessageLike["parts"]): AgentMessageLike {
  return { id: "assistant", role: "assistant", parts };
}

const user: AgentMessageLike = {
  id: "user",
  role: "user",
  parts: [{ type: "text", content: "帮我调整行程" }],
};

describe("resolveAgentStatus", () => {
  it("shows planning while thinking", () => {
    const view = resolveAgentStatus(
      [user, assistant([{ type: "thinking", content: "思考中" }])],
      true,
    );

    expect(view.active?.action).toBe("规划行程");
    expect(view.completed).toEqual([]);
  });

  it("labels running location and plan edits", () => {
    const find = resolveAgentStatus(
      [
        user,
        assistant([{ type: "tool-call", id: "c1", name: "find_locations", state: "input-complete" }]),
      ],
      true,
    );
    expect(find.active?.action).toBe("搜集景点");

    const edit = resolveAgentStatus(
      [
        user,
        assistant([{ type: "tool-call", id: "c2", name: "update_trip_plan", state: "input-complete" }]),
      ],
      true,
    );
    expect(edit.active?.action).toBe("编辑行程");
  });

  it("folds finished steps and keeps one active status", () => {
    const view = resolveAgentStatus(
      [
        user,
        assistant([
          { type: "tool-call", id: "c1", name: "find_locations", state: "complete" },
          { type: "tool-result", toolCallId: "c1", state: "complete" },
          { type: "thinking", content: "" },
        ]),
      ],
      true,
    );

    expect(view.active?.action).toBe("规划行程");
    expect(view.completed.map((step) => step.action)).toEqual(["搜集景点"]);
  });

  it("shows only completed steps after the run ends", () => {
    const view = resolveAgentStatus(
      [
        user,
        assistant([
          { type: "tool-call", id: "c1", name: "find_locations", state: "complete" },
          { type: "tool-result", toolCallId: "c1", state: "complete" },
        ]),
      ],
      false,
    );

    expect(view.active).toBeNull();
    expect(view.completed.map((step) => step.action)).toEqual(["搜集景点"]);
  });

  it("merges consecutive thinking parts and ignores earlier turns", () => {
    const view = resolveAgentStatus(
      [
        user,
        assistant([{ type: "thinking", content: "旧的一轮" }]),
        user,
        assistant([
          { type: "thinking", content: "第一段" },
          { type: "thinking", content: "第二段" },
        ]),
      ],
      true,
    );

    expect(view.active?.action).toBe("规划行程");
    expect(view.completed).toEqual([]);
  });

  it("maps all edit-related tools to readable actions", () => {
    expect(actionForTool("get_trip_plan")).toBe("读取最新行程");
    expect(actionForTool("prepare_new_trip")).toBe("准备新行程");
    expect(actionForTool("update_trip_plan")).toBe("编辑行程");
    expect(actionForTool("get_location_detail")).toBe("查看地点详情");
  });
});
