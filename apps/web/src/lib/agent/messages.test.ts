import { describe, expect, it } from "vitest";
import {
  buildAgentTurns,
  toolLabel,
  type AgentMessageLike,
} from "./messages";

const user: AgentMessageLike = {
  id: "u1",
  role: "user",
  parts: [{ type: "text", content: "帮我调整行程" }],
};

describe("buildAgentTurns", () => {
  it("shows intermediate narration and merges adjacent repeated tool calls", () => {
    const turns = buildAgentTurns(
      [
        user,
        {
          id: "a1",
          role: "assistant",
          parts: [
            { type: "text", content: "正在查询地点。" },
            { type: "tool-call", id: "c1", name: "find_locations", state: "input-complete" },
            { type: "tool-result", toolCallId: "c1", state: "complete" },
            { type: "tool-call", id: "c2", name: "find_locations", state: "complete" },
          ],
        },
        {
          id: "a2",
          role: "assistant",
          parts: [
            { type: "text", content: "已读取行程。" },
            { type: "tool-call", id: "c3", name: "get_trip_plan", state: "complete" },
          ],
        },
        {
          id: "a3",
          role: "assistant",
          parts: [{ type: "text", content: "已生成调整方案。" }],
        },
      ],
      false,
    );

    expect(turns).toHaveLength(1);
    expect(turns[0].user?.text).toBe("帮我调整行程");
    expect(turns[0].reply?.text).toBe("已生成调整方案。");
    expect(turns[0].process).toEqual([
      { kind: "text", key: "a1-0", text: "正在查询地点。" },
      { kind: "tool", key: "a1-1", label: "搜索地点", count: 2 },
      { kind: "text", key: "a2-0", text: "已读取行程。" },
      { kind: "tool", key: "a2-1", label: "读取行程", count: 1 },
    ]);
  });

  it("does not merge repeated tool calls separated by narration", () => {
    const turns = buildAgentTurns(
      [
        user,
        {
          id: "a1",
          role: "assistant",
          parts: [
            { type: "tool-call", id: "c1", name: "find_locations", state: "complete" },
            { type: "text", content: "再查一次。" },
            { type: "tool-call", id: "c2", name: "find_locations", state: "complete" },
          ],
        },
        {
          id: "a2",
          role: "assistant",
          parts: [{ type: "text", content: "完成。" }],
        },
      ],
      false,
    );

    expect(
      turns[0].process.map((item) =>
        item.kind === "tool" ? `${item.label} x${item.count}` : item.text,
      ),
    ).toEqual(["搜索地点 x1", "再查一次。", "搜索地点 x1"]);
  });

  it("treats the whole reply as final when no tool was called", () => {
    const turns = buildAgentTurns(
      [
        user,
        {
          id: "a1",
          role: "assistant",
          parts: [{ type: "text", content: "直接回复。" }],
        },
      ],
      false,
    );

    expect(turns[0].process).toEqual([]);
    expect(turns[0].reply?.text).toBe("直接回复。");
  });

  it("keeps earlier turns collapsed and marks only the last turn active", () => {
    const turns = buildAgentTurns(
      [
        user,
        { id: "a1", role: "assistant", parts: [{ type: "text", content: "旧回复。" }] },
        { id: "u2", role: "user", parts: [{ type: "text", content: "继续" }] },
        {
          id: "a2",
          role: "assistant",
          parts: [
            { type: "tool-call", id: "c1", name: "update_trip_plan", state: "input-complete" },
            { type: "text", content: "处理中。" },
          ],
        },
      ],
      true,
    );

    expect(turns).toHaveLength(2);
    expect(turns[0].active).toBe(false);
    expect(turns[1].active).toBe(true);
    expect(turns[1].process).toEqual([
      { kind: "tool", key: "a2-0", label: "编辑行程", count: 1 },
    ]);
    expect(turns[1].reply?.text).toBe("处理中。");
  });

  it("ignores thinking and empty text parts", () => {
    const turns = buildAgentTurns(
      [
        user,
        {
          id: "a1",
          role: "assistant",
          parts: [
            { type: "thinking", content: "思考" },
            { type: "text", content: "  " },
            { type: "text", content: "最终回复。" },
          ],
        },
      ],
      false,
    );

    expect(turns[0].process).toEqual([]);
    expect(turns[0].reply?.text).toBe("最终回复。");
  });

  it("maps tools to readable labels", () => {
    expect(toolLabel("find_locations")).toBe("搜索地点");
    expect(toolLabel("get_trip_plan")).toBe("读取行程");
    expect(toolLabel("update_trip_plan")).toBe("编辑行程");
    expect(toolLabel("get_location_detail")).toBe("查看地点");
    expect(toolLabel("prepare_new_trip")).toBe("准备行程");
    expect(toolLabel("unknown_tool")).toBe("处理请求");
  });
});
