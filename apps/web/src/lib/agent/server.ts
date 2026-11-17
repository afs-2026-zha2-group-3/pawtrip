import {
  chat,
  chatParamsFromRequest,
  mergeAgentTools,
  toServerSentEventsResponse,
  type AnyTextAdapter,
} from "@tanstack/ai";
import { openaiCompatible } from "@tanstack/ai-openai/compatible";
import type { FakeResponseStep } from "@tanstack/ai/testing";
import {
  AGENT_BIGMODEL_BASE_URL,
  AGENT_DEFAULT_MODEL,
} from "./constants";
import { buildSystemPrompt, sanitizeAgentContext } from "./context";
import { loadAgentEnv } from "./env";
import { AGENT_TOOL_DEFINITIONS, isAllowedAgentToolName } from "./tools";

export interface AgentServerEnv {
  [key: string]: string | undefined;
}

export interface AgentServerDeps {
  env?: AgentServerEnv;
  fetch?: typeof fetch;
  createAdapter?: (env: AgentServerEnv) => Promise<AgentAdapter> | AgentAdapter;
}

export type AgentAdapter = AnyTextAdapter;

export async function handleAgentRequest(
  request: Request,
  deps: AgentServerDeps = {},
): Promise<Response> {
  if (deps.env == null && import.meta.env.DEV) {
    const loaded = loadAgentEnv();
    if (loaded.length > 0) {
      console.info(`[agent] loaded env from ${loaded.join(", ")}`);
    }
  }
  const env = deps.env ?? (process.env as AgentServerEnv);
  const fetchFn = deps.fetch ?? fetch;
  const provider = env.PAWTRIP_AGENT_PROVIDER ?? "bigmodel";
  const fakeAllowed =
    env.NODE_ENV === "development" ||
    env.NODE_ENV === "test" ||
    env.PAWTRIP_AGENT_ALLOW_FAKE === "true";

  if (provider === "fake" && !fakeAllowed) {
    return jsonError(500, "AGENT_PROVIDER_DISABLED", "fake provider 不能用于生产环境");
  }

  const auth = await verifySession(request, env, fetchFn);
  if (!auth.ok) {
    return auth.response;
  }

  let params: Awaited<ReturnType<typeof chatParamsFromRequest>>;
  try {
    params = await chatParamsFromRequest(request);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return jsonError(400, "INVALID_REQUEST", "无法解析 Agent 请求");
  }

  try {
    const adapter =
      deps.createAdapter != null ? await deps.createAdapter(env) : await createAdapter(env);
    const clientTools = params.tools.filter((tool) => isAllowedAgentToolName(tool.name));
    const tools = mergeAgentTools(AGENT_TOOL_DEFINITIONS, clientTools);
    const context = sanitizeAgentContext(
      (params.forwardedProps as Record<string, unknown> | undefined)?.agentContext,
    );
    const stream = chat({
      adapter,
      messages: params.messages,
      threadId: params.threadId,
      runId: params.runId,
      tools,
      systemPrompts: [buildSystemPrompt(context)],
    });
    return toServerSentEventsResponse(stream);
  } catch (error) {
    console.error("[agent] failed to start chat", error);
    return jsonError(502, "AGENT_UNAVAILABLE", "Agent 服务暂时不可用");
  }
}

interface SessionResult {
  ok: boolean;
  response: Response;
}

async function verifySession(
  request: Request,
  env: AgentServerEnv,
  fetchFn: typeof fetch,
): Promise<SessionResult> {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return {
      ok: false,
      response: jsonError(401, "UNAUTHENTICATED", "请先登录"),
    };
  }
  const baseUrl = (env.PAWTRIP_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");
  try {
    const response = await fetchFn(`${baseUrl}/api/auth/me`, {
      headers: { cookie, accept: "application/json" },
      signal: request.signal,
    });
    if (response.status === 200) {
      return { ok: true, response };
    }
    return {
      ok: false,
      response: jsonError(401, "UNAUTHENTICATED", "登录会话已失效"),
    };
  } catch {
    return {
      ok: false,
      response: jsonError(502, "AUTH_UNAVAILABLE", "无法校验登录会话"),
    };
  }
}

async function createAdapter(env: AgentServerEnv): Promise<AgentAdapter> {
  const provider = env.PAWTRIP_AGENT_PROVIDER ?? "bigmodel";
  if (provider === "fake") {
    const { fakeText } = await import("@tanstack/ai/testing");
    const adapter = fakeText();
    adapter.setResponses([createFakeResponseStep()]);
    return adapter;
  }
  const apiKey = env.BIGMODEL_API_KEY;
  if (!apiKey) {
    throw new Error("BIGMODEL_API_KEY is required");
  }
  const model = env.PAWTRIP_AGENT_MODEL ?? AGENT_DEFAULT_MODEL;
  const baseURL = env.PAWTRIP_AGENT_BASE_URL ?? AGENT_BIGMODEL_BASE_URL;
  const bigmodel = openaiCompatible({
    name: "bigmodel",
    baseURL,
    apiKey,
    models: [model],
  });
  return bigmodel(model);
}

function jsonError(status: number, code: string, detail: string): Response {
  return new Response(JSON.stringify({ code, detail }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

interface ToolResult {
  kind: "find_locations" | "propose_trip_plan" | "prepare_new_trip" | "get_location_detail" | null;
  output: Record<string, unknown>;
}

function createFakeResponseStep(): FakeResponseStep {
  return ({ request }) => {
    const prompt = (request.systemPrompts ?? [])
      .map((entry) => (typeof entry === "string" ? entry : entry.content))
      .join("\n");
    const mode = /"mode":"(new|existing)"/.exec(prompt)?.[1] ?? null;
    const targetTripId = numberFrom(/"targetTripId":(\d+)/.exec(prompt)?.[1]);
    const cityName = /"cityName":"([^"]+)"/.exec(prompt)?.[1] ?? null;
    const last = lastToolResult(request.messages);
    const userText = lastUserText(request.messages);

    if (last?.kind === "propose_trip_plan") {
      return { text: "方案已生成，请在方案卡片中确认是否应用。" };
    }
    if (last?.kind === "get_location_detail") {
      return { text: "已读取地点详情，可以继续编排。" };
    }
    if (last?.kind === "prepare_new_trip") {
      const status = String(last.output.status ?? "");
      if (status === "created" && typeof last.output.tripId === "number") {
        return {
          text: "行程已创建，正在查找可用地点。",
          toolCalls: [{ name: "find_locations", input: { query: "" } }],
        };
      }
      if (status === "cancelled") {
        return { text: "已取消创建行程，当前激活行程保持不变。" };
      }
      if (status === "no_pets") {
        return { text: "请先在 Paws 页面添加宠物档案，再创建行程。" };
      }
      return { text: String(last.output.message ?? "未能创建行程，请补充信息。") };
    }
    if (last?.kind === "find_locations") {
      const candidates = Array.isArray(last.output.candidates) ? last.output.candidates : [];
      const poiIds = candidates
        .map((candidate) =>
          candidate && typeof candidate === "object" && "poiId" in candidate
            ? String((candidate as { poiId: unknown }).poiId)
            : "",
        )
        .filter(Boolean)
        .slice(0, 2);
      const tripId = numberFrom(last.output.targetTripId) ?? targetTripId;
      if (candidates.length === 0) {
        return {
          text: last.output.noLocations
            ? "目标城市暂时没有可用于规划的已保存地点。"
            : "未找到匹配的 Pawtrip 已收录地点，请换一个名称或查看其它已收录地点。",
        };
      }
      if (!tripId || poiIds.length === 0) {
        return { text: "请先在面板中选择规划目标，再继续编排。" };
      }
      const truncation = last.output.truncated ? "地点目录超过抓取上限，匹配可能不完整。" : "";
      return {
        text: truncation
          ? `${truncation}已先按当前候选生成待确认方案。`
          : "已找到可用地点，正在生成待确认方案。",
        toolCalls: [
          {
            name: "propose_trip_plan",
            input: {
              target: { kind: "existing", tripId },
              plan: {
                version: 1,
                days: [
                  {
                    day: 1,
                    stops: poiIds.map((poiId, index) => ({
                      poiId,
                      ...(index < poiIds.length - 1 ? { toNext: "walk" } : {}),
                    })),
                  },
                ],
                unscheduled: [],
              },
              summary: "为第 1 天安排已查询到的候选地点。",
              warnings: [],
            },
          },
        ],
      };
    }

    if (mode === "existing" && targetTripId) {
      return {
        text: "正在查询目标城市的地点。",
        toolCalls: [{ name: "find_locations", input: { query: fakeLocationQuery(userText) } }],
      };
    }
    return {
      text: "正在为你打开新行程创建确认弹窗。",
      toolCalls: [
        {
          name: "prepare_new_trip",
          input: {
            cityName: cityName ?? guessCity(userText) ?? "珠海",
            startDate: dateOffset(1),
            endDate: dateOffset(2),
          },
        },
      ],
    };
  };
}

function guessCity(text: string): string | null {
  const match = /(珠海|杭州|深圳|广州|上海|北京)/.exec(text);
  return match?.[1] ?? null;
}

function fakeLocationQuery(text: string): string {
  return /不存在|未收录/.test(text) ? "不存在的地点" : "";
}

function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function lastUserText(messages: readonly unknown[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as { role?: string; content?: unknown };
    if (message?.role === "user") {
      return messageText(message.content);
    }
  }
  return "";
}

function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join(" ");
  }
  return "";
}

function lastToolResult(messages: readonly unknown[]): ToolResult | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index] as {
      role?: string;
      content?: unknown;
      parts?: Array<Record<string, unknown>>;
    };
    if (Array.isArray(message.parts)) {
      for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex -= 1) {
        const part = message.parts[partIndex];
        if (part.type === "tool-result") {
          const output = parseJsonish(part.content);
          return { kind: classifyToolOutput(output), output };
        }
      }
    }
    if (message.role === "tool") {
      const output = parseJsonish(message.content);
      return { kind: classifyToolOutput(output), output };
    }
    if (message.role === "user") {
      break;
    }
  }
  return null;
}

function classifyToolOutput(output: Record<string, unknown>): ToolResult["kind"] {
  if (Array.isArray(output.candidates)) return "find_locations";
  if (typeof output.proposalId === "string") return "propose_trip_plan";
  if (
    typeof output.status === "string" &&
    ["created", "cancelled", "needs_input", "no_pets", "save_failed", "failed"].includes(
      output.status,
    )
  ) {
    return "prepare_new_trip";
  }
  if (typeof output.poiId === "string") return "get_location_detail";
  return null;
}

function parseJsonish(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (Array.isArray(value)) {
    for (const part of value) {
      const parsed = parseJsonish(part);
      if (Object.keys(parsed).length > 0) return parsed;
    }
  }
  return {};
}

function numberFrom(value: unknown): number | null {
  if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return null;
}
