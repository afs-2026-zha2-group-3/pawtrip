export interface AgentMessageLike {
  id?: string;
  role: string;
  parts?: ReadonlyArray<AgentPartLike>;
}

export interface AgentPartLike {
  type: string;
  content?: string;
  name?: string;
  state?: string;
  id?: string;
  toolCallId?: string;
}

export type AgentProcessItem =
  | { kind: "text"; key: string; text: string }
  | { kind: "tool"; key: string; label: string; count: number };

export interface AgentTurnView {
  key: string;
  user: { id: string; text: string } | null;
  process: AgentProcessItem[];
  reply: { id: string; text: string } | null;
  active: boolean;
}

export function toolLabel(name: string | undefined): string {
  switch (name) {
    case "find_locations":
      return "搜索地点";
    case "get_location_detail":
      return "查看地点";
    case "get_trip_plan":
      return "读取行程";
    case "prepare_new_trip":
      return "准备行程";
    case "update_trip_plan":
      return "编辑行程";
    default:
      return "处理请求";
  }
}

interface OrderedPart {
  part: AgentPartLike;
  key: string;
}

export function buildAgentTurns(
  messages: ReadonlyArray<AgentMessageLike>,
  isLoading: boolean,
): AgentTurnView[] {
  const turns: Array<{ user: AgentMessageLike | null; assistants: AgentMessageLike[] }> = [];

  for (const message of messages) {
    if (message.role === "user") {
      turns.push({ user: message, assistants: [] });
      continue;
    }
    if (message.role !== "assistant") continue;
    const current = turns[turns.length - 1];
    if (current) current.assistants.push(message);
  }

  return turns.map(({ user, assistants }, index) => {
    const parts: OrderedPart[] = [];
    for (const message of assistants) {
      (message.parts ?? []).forEach((part, partIndex) => {
        parts.push({
          part,
          key: `${message.id ?? "assistant"}-${partIndex}`,
        });
      });
    }

    let lastToolCall = -1;
    parts.forEach(({ part }, partIndex) => {
      if (part.type === "tool-call") lastToolCall = partIndex;
    });

    const process: AgentProcessItem[] = [];
    const replyParts: string[] = [];
    let replyId: string | null = null;

    parts.forEach(({ part, key }, partIndex) => {
      if (part.type === "text") {
        const text = (part.content ?? "").trim();
        if (!text) return;
        if (partIndex > lastToolCall) {
          replyParts.push(text);
          replyId = key;
        } else {
          process.push({ kind: "text", key, text });
        }
        return;
      }
      if (part.type !== "tool-call" || partIndex > lastToolCall) return;
      const label = toolLabel(part.name);
      const previous = process[process.length - 1];
      if (previous?.kind === "tool" && previous.label === label) {
        previous.count += 1;
      } else {
        process.push({ kind: "tool", key, label, count: 1 });
      }
    });

    const userId = user?.id ?? "user";
    const text = (user?.parts ?? [])
      .filter((part) => part.type === "text")
      .map((part) => (part.content ?? "").trim())
      .filter(Boolean)
      .join("\n");

    return {
      key: userId,
      user: user && text ? { id: userId, text } : null,
      process,
      reply:
        replyParts.length > 0
          ? { id: replyId ?? `${userId}-reply`, text: replyParts.join("\n\n") }
          : null,
      active: isLoading && index === turns.length - 1,
    };
  });
}
