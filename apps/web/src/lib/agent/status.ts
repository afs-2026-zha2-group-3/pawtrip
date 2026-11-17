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

export interface AgentStatusStep {
  key: string;
  action: string;
}

export interface AgentStatusView {
  active: AgentStatusStep | null;
  completed: AgentStatusStep[];
}

interface InternalStep extends AgentStatusStep {
  kind: "thinking" | "tool" | "planning";
  active: boolean;
}

const FINISHED_TOOL_STATES = new Set(["complete", "error"]);
const FINISHED_RESULT_STATES = new Set(["complete", "error"]);

export function actionForTool(name: string | undefined): string {
  switch (name) {
    case "find_locations":
      return "搜集景点";
    case "get_location_detail":
      return "查看地点详情";
    case "get_trip_plan":
      return "读取最新行程";
    case "prepare_new_trip":
      return "准备新行程";
    case "update_trip_plan":
      return "编辑行程";
    default:
      return "处理请求";
  }
}

export function resolveAgentStatus(
  messages: ReadonlyArray<AgentMessageLike>,
  isLoading: boolean,
): AgentStatusView {
  let turnStart = 0;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index]?.role === "user") {
      turnStart = index + 1;
      break;
    }
  }
  const turn = messages.slice(turnStart);

  const resultStates = new Map<string, string>();
  for (const message of turn) {
    for (const part of message.parts ?? []) {
      if (part.type === "tool-result" && part.toolCallId) {
        resultStates.set(part.toolCallId, part.state ?? "complete");
      }
    }
  }

  const lastMessageIndex = turn.length - 1;
  const steps: InternalStep[] = [];
  const seenToolCalls = new Set<string>();

  for (let messageIndex = 0; messageIndex < turn.length; messageIndex += 1) {
    const parts = turn[messageIndex].parts ?? [];
    for (let partIndex = 0; partIndex < parts.length; partIndex += 1) {
      const part = parts[partIndex];
      const isLastPart =
        messageIndex === lastMessageIndex && partIndex === parts.length - 1;

      if (part.type === "thinking") {
        const active = isLastPart && isLoading;
        const previous = steps[steps.length - 1];
        if (previous?.kind === "thinking") {
          previous.active = active;
        } else {
          steps.push({
            key: `thinking-${messageIndex}-${partIndex}`,
            kind: "thinking",
            action: "规划行程",
            active,
          });
        }
        continue;
      }

      if (part.type === "tool-call") {
        const id = part.id ?? `tool-${messageIndex}-${partIndex}`;
        seenToolCalls.add(id);
        const resultState = resultStates.get(id);
        const finished =
          resultState != null
            ? FINISHED_RESULT_STATES.has(resultState)
            : FINISHED_TOOL_STATES.has(part.state ?? "");
        steps.push({
          key: `tool-${id}`,
          kind: "tool",
          action: actionForTool(part.name),
          active: !finished && isLoading,
        });
        continue;
      }

      if (part.type === "tool-result" && part.name) {
        if (part.toolCallId && seenToolCalls.has(part.toolCallId)) {
          continue;
        }
        steps.push({
          key: `result-${part.toolCallId ?? `${messageIndex}-${partIndex}`}`,
          kind: "tool",
          action: actionForTool(part.name),
          active: part.state === "streaming" && isLoading,
        });
      }
    }
  }

  let lastActiveIndex = -1;
  for (let index = steps.length - 1; index >= 0; index -= 1) {
    if (steps[index].active) {
      lastActiveIndex = index;
      break;
    }
  }
  if (lastActiveIndex >= 0) {
    steps.forEach((step, index) => {
      if (index !== lastActiveIndex) step.active = false;
    });
    const active = steps[lastActiveIndex];
    return {
      active: { key: active.key, action: active.action },
      completed: steps.slice(0, lastActiveIndex).map(toPublicStep),
    };
  }

  return {
    active: isLoading ? { key: "planning", action: "规划行程" } : null,
    completed: steps.map(toPublicStep),
  };
}

function toPublicStep(step: InternalStep): AgentStatusStep {
  return { key: step.key, action: step.action };
}
