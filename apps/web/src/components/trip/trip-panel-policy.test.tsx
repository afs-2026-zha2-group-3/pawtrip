// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripPanel } from "./trip-panel";
import { tripActions, tripStore } from "@/lib/trip/store";
import type { LocationBrowseDetail, PetPolicies } from "@/queries/locations";
import type { Trip, TripPlan } from "@/lib/trip/types";
import type { TransportMode } from "@/data/transport-rules";

vi.mock("@/components/ui/animated-list", () => ({
  AnimatedList: (props: {
    items: { id: string }[];
    renderItem: (item: { id: string }) => React.ReactNode;
  }) => (
    <div data-testid="animated-list">
      {props.items.map((item) => (
        <div key={item.id}>{props.renderItem(item)}</div>
      ))}
    </div>
  ),
}));

// 面板在测试外没有 Router 上下文；只替换 Link 为普通锚点，其他路由导出保持原样。
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/trips" } }),
}));

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

const PET = {
  id: 1,
  name: "毛毛",
  petType: "DOG",
  weightKg: 38,
  shoulderHeightCm: 55,
  hasLeash: false,
  hasVaccinationProof: true,
  photo: null,
  dogBreed: null,
};

function policies(patch: Partial<PetPolicies> = {}): PetPolicies {
  return {
    allowedPetTypes: null,
    maxPetsPerPerson: null,
    maxSinglePetWeightKg: null,
    maxSinglePetShoulderHeightCm: null,
    leashRequired: null,
    vaccinationProofRequired: null,
    extraFeeCents: null,
    reservationRequired: null,
    ...patch,
  };
}

function location(poiId: string, name: string, patch: Partial<PetPolicies> = {}): LocationBrowseDetail {
  return {
    poiId,
    name,
    typeCode: "110000",
    typeGroup: "attraction",
    address: null,
    regionCode: null,
    petPolicies: policies(patch),
    coverPhotoUrl: null,
    rating: null,
  };
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function tripWith(plan: TripPlan, transportMode: TransportMode | null = null): Trip {
  return {
    id: 7,
    name: "珠海 · 3天 · 毛毛",
    cityAdcode: "440400",
    petId: 1,
    totalDays: 3,
    startDate: null,
    transportMode,
    plan,
    createdAt: "2026-11-17T00:00:00Z",
    updatedAt: "2026-11-17T00:00:00Z",
  };
}

function twoStopPlan(): TripPlan {
  return {
    version: 1,
    days: [
      { day: 1, stops: [{ poiId: "poi-a" }, { poiId: "poi-b" }] },
      { day: 2, stops: [] },
      { day: 3, stops: [] },
    ],
    unscheduled: [{ poiId: "poi-u" }],
  };
}

function renderPanel(options: {
  locations?: LocationBrowseDetail[];
  transportMode?: TransportMode | null;
  plan?: TripPlan;
}) {
  tripActions.setActive(tripWith(options.plan ?? twoStopPlan(), options.transportMode ?? null));
  for (const detail of options.locations ?? [
    location("poi-a", "景点A", { leashRequired: true }),
    location("poi-b", "景点B"),
    location("poi-u", "未排期景点", { leashRequired: true }),
  ]) {
    tripActions.cacheLocation(detail);
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TripPanel />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation((input) => {
    const url = String(input);
    if (url.startsWith("/api/pets")) return Promise.resolve(jsonResponse([PET]));
    if (url.includes("/route-estimate")) {
      return Promise.resolve(jsonResponse({ code: "UPSTREAM_FAILURE" }, 502));
    }
    return Promise.resolve(jsonResponse({ code: "NOT_FOUND" }, 404));
  });
  vi.stubGlobal("fetch", fetchMock);
  tripActions.resetForTests();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("day policy reminder placement", () => {
  it("renders the reminder after the day header and transit notice, before the first stop row", async () => {
    const { container } = renderPanel({});
    await screen.findByText("毛毛");

    const reminder = await screen.findByTestId("day-policy-reminder");
    expect(reminder.textContent).toContain("当天需携带牵引绳（档案未登记牵引绳，请自备）");

    const notice = screen.getByTestId("transit-pet-notice");
    const firstStop = container.querySelector('[data-stop-id="d1:0:poi-a"]')!;
    expect(firstStop).toBeTruthy();
    // 顺序：公交提示 → 政策提醒 → 首个景点行
    expect(
      notice.compareDocumentPosition(reminder) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      reminder.compareDocumentPosition(firstStop) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("names the exceeded attraction and both limits", async () => {
    renderPanel({
      locations: [
        location("poi-a", "景点A", { maxSinglePetWeightKg: 8.5, maxSinglePetShoulderHeightCm: 40 }),
        location("poi-b", "景点B"),
      ],
    });
    await screen.findByText("毛毛");

    const reminder = await screen.findByTestId("day-policy-reminder");
    expect(reminder.textContent).toContain("您的宠物超出景点 景点A 限制（≤8.5kg/≤40cm）");
  });

  it("renders no reminder without triggers and never counts unscheduled stops", async () => {
    renderPanel({
      locations: [
        location("poi-a", "景点A"),
        location("poi-b", "景点B"),
        location("poi-u", "未排期景点", { leashRequired: true, maxSinglePetWeightKg: 1 }),
      ],
    });
    await screen.findByText("毛毛");

    await waitFor(() => {
      expect(screen.queryByTestId("day-policy-reminder")).toBeNull();
    });
  });

  it("keeps the reminder in self-drive mode while hiding the transit notice", async () => {
    renderPanel({ transportMode: "drive" });
    await screen.findByText("毛毛");

    expect(await screen.findByTestId("day-policy-reminder")).toBeTruthy();
    expect(screen.queryByTestId("transit-pet-notice")).toBeNull();
  });

  it("does not write the store or issue extra requests for the reminder", async () => {
    const revision = tripStore.state.saveRevision;
    renderPanel({});
    await screen.findByText("毛毛");
    await screen.findByTestId("day-policy-reminder");

    expect(tripStore.state.saveRevision).toBe(revision);
    const putCalls = fetchMock.mock.calls.filter(
      ([, init]) => (init as RequestInit | undefined)?.method === "PUT",
    );
    expect(putCalls).toHaveLength(0);
    const policyCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes("/policy"),
    );
    expect(policyCalls).toHaveLength(0);
  });
});