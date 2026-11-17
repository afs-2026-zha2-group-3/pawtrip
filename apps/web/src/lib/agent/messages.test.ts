import { describe, expect, it } from "vitest";
import { visibleAgentMessages } from "./messages";
import type { AgentMessageLike } from "./status";

const user: AgentMessageLike = {
  id: "user",
  role: "user",
  parts: [{ type: "text", content: "帮我安排住宿" }],
};

describe("visibleAgentMessages", () => {
  it("hides assistant narration attached to tool calls and keeps the final reply", () => {
    const messages: AgentMessageLike[] = [
      user,
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "text", content: "我先读取当前行程计划。" },
          { type: "tool-call", id: "c1", name: "get_trip_plan", state: "input-complete" },
        ],
      },
      {
        id: "a2",
        role: "assistant",
        parts: [{ type: "tool-call", id: "c2", name: "find_locations", state: "complete" }],
      },
      {
        id: "a3",
        role: "assistant",
        parts: [{ type: "text", content: "方案已生成，请在下方确认。" }],
      },
    ];

    expect(visibleAgentMessages(messages).map((message) => message.id)).toEqual([
      "user",
      "a3",
    ]);
  });

  it("keeps final replies from earlier turns and drops thinking-only messages", () => {
    const messages: AgentMessageLike[] = [
      user,
      { id: "a1", role: "assistant", parts: [{ type: "text", content: "旧回复" }] },
      { id: "u2", role: "user", parts: [{ type: "text", content: "继续" }] },
      { id: "a2", role: "assistant", parts: [{ type: "thinking", content: "思考中" }] },
    ];

    expect(visibleAgentMessages(messages).map((message) => message.id)).toEqual([
      "user",
      "a1",
      "u2",
    ]);
  });
});
