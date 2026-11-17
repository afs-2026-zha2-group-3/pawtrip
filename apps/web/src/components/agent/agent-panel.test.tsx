import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AgentPanel } from "./agent-panel";
import { agentActions, agentStore } from "@/lib/agent/store";
import { tripActions, tripStore } from "@/lib/trip/store";

const chat = vi.hoisted(() => ({
  state: {
    messages: [] as unknown[],
    isLoading: false,
    error: undefined as Error | undefined,
  },
  sendMessage: vi.fn(async () => undefined),
}));

vi.mock("@tanstack/ai-react", () => ({
  fetchServerSentEvents: () => ({ kind: "mock-connection" }),
  useChat: () => ({
    messages: chat.state.messages,
    isLoading: chat.state.isLoading,
    error: chat.state.error,
    sendMessage: chat.sendMessage,
  }),
}));

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function renderPanel() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return render(<AgentPanel />, { wrapper });
}

const trip = {
  id: 4,
  name: "珠海两日",
  cityAdcode: "440400",
  petId: 1,
  totalDays: 2,
  startDate: null,
  transportMode: null,
  plan: { version: 1 as const, days: [], unscheduled: [] },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const pendingProposal = {
  id: "call-1",
  tripId: 4,
  plan: {
    version: 1 as const,
    days: [{ day: 1, stops: [{ poiId: "a" }] }],
    unscheduled: [],
  },
  summary: "为第 1 天安排地点",
  warnings: [],
  baseUpdatedAt: trip.updatedAt,
  status: "pending" as const,
  createdAt: "2026-01-01T00:00:00Z",
};

describe("AgentPanel", () => {
  beforeEach(() => {
    agentActions.resetForTests();
    tripActions.resetForTests();
    chat.state.messages = [];
    chat.state.isLoading = false;
    chat.state.error = undefined;
    document.cookie = "XSRF-TOKEN=test-token";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = (init?.method ?? "GET").toUpperCase();
        if (url === "/api/trips/4" && method === "GET") return jsonResponse(trip);
        if (url === "/api/trips/4" && method === "PUT") {
          const saved = JSON.parse(String(init?.body ?? "{}")) as { plan?: unknown };
          return jsonResponse({
            ...trip,
            plan: saved.plan ?? trip.plan,
            updatedAt: "2026-01-02T00:00:00Z",
          });
        }
        if (url.startsWith("/api/locations/")) {
          return jsonResponse({ poiId: "a", name: "珠海渔女", regionCode: "440402" });
        }
        if (url.startsWith("/api/trips")) return jsonResponse([]);
        if (url.startsWith("/api/destinations")) return jsonResponse([]);
        if (url.startsWith("/api/pets")) return jsonResponse([]);
        return jsonResponse([]);
      }),
    );
  });

  it("shows the global entry without an active trip and opens the panel", async () => {
    renderPanel();

    const fab = screen.getByTestId("agent-fab");
    expect(fab).toBeTruthy();
    expect(screen.queryByTestId("agent-panel")).toBeNull();

    fireEvent.click(fab);

    await waitFor(() => {
      expect(screen.getByTestId("agent-panel")).toBeTruthy();
    });
    expect(screen.getByText(/描述城市、日期、宠物/)).toBeTruthy();
    expect(screen.getByTestId("agent-current-trip").textContent).toContain("未激活行程");
    expect(tripStore.state.active).toBeNull();
  });

  it("follows the active trip and clears stale proposals when it changes", async () => {
    agentActions.setOpen(true);
    agentActions.addProposal(pendingProposal);

    renderPanel();
    expect(screen.getByTestId("agent-current-trip").textContent).toContain("未激活行程");
    expect(screen.queryByTestId("agent-proposal")).toBeNull();

    act(() => tripActions.setActive(trip));

    await waitFor(() => {
      expect(screen.getByTestId("agent-current-trip").textContent).toContain("珠海两日");
    });
    expect(agentStore.state.proposals).toEqual([]);
  });

  it("rejects a pending proposal and closes the card without writing the trip", async () => {
    tripActions.setActive(trip);
    agentActions.addProposal(pendingProposal);
    agentActions.setOpen(true);

    renderPanel();

    const card = await screen.findByTestId("agent-proposal");
    expect(card.textContent).toContain("待确认方案");
    fireEvent.click(screen.getByRole("button", { name: "拒绝" }));

    await waitFor(() => {
      expect(screen.queryByTestId("agent-proposal")).toBeNull();
    });
    expect(agentStore.state.proposals).toEqual([]);
    expect(tripStore.state.active?.plan).toEqual(trip.plan);
  });

  it("removes the pending proposal card after applying it", async () => {
    tripActions.setActive(trip);
    agentActions.addProposal(pendingProposal);
    agentActions.setOpen(true);

    renderPanel();

    await screen.findByTestId("agent-proposal");
    fireEvent.click(screen.getByRole("button", { name: "确认应用" }));

    await waitFor(() => {
      expect(screen.queryByTestId("agent-proposal")).toBeNull();
    });
    expect(agentStore.state.proposals).toEqual([]);
    expect(tripStore.state.active?.plan.days[0].stops).toEqual([{ poiId: "a" }]);
  });

  it("right-aligns user messages in a light green bubble without identity marks", async () => {
    agentActions.setOpen(true);
    chat.state.messages = [
      { id: "u1", role: "user", parts: [{ type: "text", content: "帮我安排住宿" }] },
    ];

    renderPanel();

    const bubble = (await screen.findByText("帮我安排住宿")).closest(
      '[data-slot="bubble"]',
    ) as HTMLElement;
    expect(bubble.className).toContain("bg-emerald-100");
    expect(bubble.className).toContain("text-black");

    const content = bubble.parentElement as HTMLElement;
    expect(content.className).toContain("items-end");

    const message = bubble.closest('[data-slot="message"]') as HTMLElement;
    expect(message.querySelector("img, svg")).toBeNull();
  });

  it("shows intermediate narration in a collapsed process block", async () => {
    agentActions.setOpen(true);
    chat.state.messages = [
      { id: "u1", role: "user", parts: [{ type: "text", content: "帮我安排住宿" }] },
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
        parts: [{ type: "text", content: "方案已生成，请在下方确认。" }],
      },
    ];

    renderPanel();

    expect(await screen.findByText("方案已生成，请在下方确认。")).toBeTruthy();
    expect(screen.getByText("我先读取当前行程计划。")).toBeTruthy();
    expect(screen.getByText("读取行程")).toBeTruthy();

    const process = screen.getByTestId(
      "agent-process-collapsed",
    ) as HTMLDetailsElement;
    expect(process.open).toBe(false);
    expect(process.querySelector("summary")?.textContent).toBe("过程");

    fireEvent.click(process.querySelector("summary")!);
    expect(process.open).toBe(true);
  });

  it("merges adjacent repeated tool calls into one tag", () => {
    agentActions.setOpen(true);
    chat.state.messages = [
      { id: "u1", role: "user", parts: [{ type: "text", content: "帮我找地点" }] },
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "tool-call", id: "c1", name: "find_locations", state: "complete" },
          { type: "tool-call", id: "c2", name: "find_locations", state: "complete" },
          { type: "text", content: "再查一次。" },
          { type: "tool-call", id: "c3", name: "find_locations", state: "complete" },
        ],
      },
      {
        id: "a2",
        role: "assistant",
        parts: [{ type: "text", content: "完成。" }],
      },
    ];

    renderPanel();

    expect(screen.getByText("搜索地点 x2")).toBeTruthy();
    expect(screen.getByText("搜索地点")).toBeTruthy();
  });

  it("asks before deactivating the current trip for a new trip", async () => {
    tripActions.setActive(trip);
    agentActions.setOpen(true);
    agentActions.setNewTripFlow({
      city: {
        adcode: "440400",
        name: "珠海",
        province: "广东省",
        policyCovered: true,
        bannedBreeds: [],
        allowedPetTypes: "DOG",
        allowedDogBreedIds: [],
        maxSinglePetShoulderHeightCm: null,
      },
      startDate: "2026-12-01",
      endDate: "2026-12-02",
      petId: 1,
      stage: "confirm-deactivate",
      resolve: vi.fn(),
    });

    renderPanel();

    const confirm = await screen.findByTestId("agent-deactivate-confirm");
    expect(confirm.textContent).toContain("取消当前激活行程");
    expect(screen.getByRole("button", { name: "确认并继续" })).toBeTruthy();
    expect(tripStore.state.active?.id).toBe(4);
  });

  it("shows a single thinking status while processing", () => {
    chat.state.messages = [
      { id: "u1", role: "user", parts: [{ type: "text", content: "帮我调整行程" }] },
      { id: "a1", role: "assistant", parts: [{ type: "thinking", content: "" }] },
    ];
    chat.state.isLoading = true;
    agentActions.setOpen(true);

    renderPanel();

    expect(screen.getAllByTestId("agent-status")).toHaveLength(1);
    expect(screen.getByTestId("agent-status").textContent).toContain("正在思考");
  });

  it("shows tool calls as light tags while thinking", () => {
    agentActions.setOpen(true);
    chat.state.isLoading = true;
    chat.state.messages = [
      { id: "u1", role: "user", parts: [{ type: "text", content: "帮我找景点" }] },
      {
        id: "a1",
        role: "assistant",
        parts: [{ type: "tool-call", id: "c1", name: "find_locations", state: "input-complete" }],
      },
    ];

    const { unmount } = renderPanel();
    expect(screen.getByTestId("agent-status").textContent).toContain("正在思考");
    expect(screen.getByText("搜索地点")).toBeTruthy();
    unmount();

    chat.state.messages = [
      { id: "u2", role: "user", parts: [{ type: "text", content: "帮我调整" }] },
      {
        id: "a2",
        role: "assistant",
        parts: [{ type: "tool-call", id: "c2", name: "update_trip_plan", state: "input-complete" }],
      },
    ];
    renderPanel();
    expect(screen.getByText("编辑行程")).toBeTruthy();
  });

  it("shows thinking without completed steps", () => {
    chat.state.messages = [
      { id: "u1", role: "user", parts: [{ type: "text", content: "帮我调整行程" }] },
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "tool-call", id: "c1", name: "find_locations", state: "complete" },
          { type: "tool-result", toolCallId: "c1", state: "complete" },
          { type: "thinking", content: "" },
        ],
      },
    ];
    chat.state.isLoading = true;
    agentActions.setOpen(true);

    renderPanel();

    expect(screen.getAllByTestId("agent-status")).toHaveLength(1);
    expect(screen.getByTestId("agent-status").textContent).toContain("正在思考");
    expect(screen.queryByTestId("agent-completed-steps")).toBeNull();
    expect(screen.getByTestId("agent-status").textContent).not.toContain("已完成");
  });

  it("hides the status and collapses the process when idle", () => {
    chat.state.messages = [
      { id: "u1", role: "user", parts: [{ type: "text", content: "帮我调整行程" }] },
      {
        id: "a1",
        role: "assistant",
        parts: [
          { type: "tool-call", id: "c1", name: "get_trip_plan", state: "complete" },
          { type: "tool-result", toolCallId: "c1", state: "complete" },
        ],
      },
    ];
    chat.state.isLoading = false;
    agentActions.setOpen(true);

    renderPanel();

    expect(screen.queryByTestId("agent-status")).toBeNull();
    expect(screen.getByTestId("agent-process-collapsed")).toBeTruthy();
    expect(screen.queryByTestId("agent-completed-steps")).toBeNull();
  });
});
