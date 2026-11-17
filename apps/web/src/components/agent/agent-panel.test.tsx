import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AgentPanel } from "./agent-panel";
import { agentActions, agentStore } from "@/lib/agent/store";
import { tripActions, tripStore } from "@/lib/trip/store";

vi.mock("@tanstack/ai-react", () => ({
  fetchServerSentEvents: () => ({ kind: "mock-connection" }),
  useChat: () => ({
    messages: [],
    isLoading: false,
    error: undefined,
    sendMessage: vi.fn(async () => undefined),
  }),
}));

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
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
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
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
    expect(tripStore.state.active).toBeNull();
  });

  it("rejects a pending proposal without writing the trip", async () => {
    agentActions.setTarget({ kind: "existing", tripId: 4 }, trip);
    agentActions.addProposal(pendingProposal);
    agentActions.setOpen(true);

    renderPanel();

    const card = await screen.findByTestId("agent-proposal");
    expect(card.textContent).toContain("待确认方案");
    fireEvent.click(screen.getByRole("button", { name: "拒绝" }));

    await waitFor(() => {
      expect(agentStore.state.proposals[0].status).toBe("rejected");
    });
    expect(tripStore.state.active).toBeNull();
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
});
