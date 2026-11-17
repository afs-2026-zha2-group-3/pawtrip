import type { AgentMessageLike } from "./status";

export function visibleAgentMessages(
  messages: ReadonlyArray<AgentMessageLike>,
): AgentMessageLike[] {
  return messages.filter((message) => {
    if (message.role !== "user" && message.role !== "assistant") {
      return false;
    }
    const parts = message.parts ?? [];
    if (!parts.some((part) => part.type === "text" && (part.content ?? "").trim() !== "")) {
      return false;
    }
    return !parts.some((part) => part.type === "tool-call");
  });
}
