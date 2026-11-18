// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TripPanel } from "./trip-panel";
import { tripActions } from "@/lib/trip/store";
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

// 地点浏览页路径，使 embedded 面板通过 onAttractions === embedded 门禁。
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouterState: ({ select }: { select: (state: { location: { pathname: string } }) => unknown }) =>
    select({ location: { pathname: "/attractions" } }),
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
    unscheduled: [],
  };
}

function renderTimeline(options: {
  locations?: LocationBrowseDetail[];
  transportMode?: TransportMode | null;
  plan?: TripPlan;
}) {
  tripActions.setActive(tripWith(options.plan ?? twoStopPlan(), options.transportMode ?? null));
  for (const detail of options.locations ?? [
    location("poi-a", "景点A", { leashRequired: true }),
    location("poi-b", "景点B"),
  ]) {
    tripActions.cacheLocation(detail);
  }
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <TripPanel embedded timeline />
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

describe("timeline panel restores trip-panel hints and transport", () => {
  it("shows the transit notice, day policy reminder and a transport segment between stops", async () => {
    const { container } = renderTimeline({});

    const notice = await screen.findByTestId("transit-pet-notice");
    expect(notice.textContent).toBe("地铁/公交：不可携带宠物上车");

    const reminder = await screen.findByTestId("day-policy-reminder");
    expect(reminder.textContent).toContain("当天需携带牵引绳（档案未登记牵引绳，请自备）");

    const segments = screen.getAllByTestId("transport-segment");
    expect(segments).toHaveLength(1);
    expect(screen.getByRole("combobox", { name: "选择途内交通方式" })).toBeTruthy();

    // 顺序与行程面板一致：公交提示 → 政策提醒 → 首个景点 → 交通段 → 第二个景点
    const firstStop = container.querySelector('[data-stop-id="d1:0:poi-a"]')!;
    const secondStop = container.querySelector('[data-stop-id="d1:1:poi-b"]')!;
    expect(firstStop).toBeTruthy();
    expect(secondStop).toBeTruthy();
    expect(
      notice.compareDocumentPosition(reminder) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      reminder.compareDocumentPosition(firstStop) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      firstStop.compareDocumentPosition(segments[0]) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      segments[0].compareDocumentPosition(secondStop) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("hides the transit notice in self-drive mode but keeps the policy reminder and segment", async () => {
    renderTimeline({ transportMode: "drive" });

    expect(await screen.findByTestId("day-policy-reminder")).toBeTruthy();
    expect(screen.queryByTestId("transit-pet-notice")).toBeNull();
    expect(screen.getAllByTestId("transport-segment")).toHaveLength(1);
  });

  it("renders no notice, reminder or segment for a day without stops", async () => {
    renderTimeline({
      plan: { version: 1, days: [{ day: 1, stops: [] }, { day: 2, stops: [] }, { day: 3, stops: [] }], unscheduled: [] },
    });

    // 等待面板渲染完成（Day 头）后断言无提示/段
    await screen.findByText("Day 1");
    expect(screen.queryByTestId("transit-pet-notice")).toBeNull();
    expect(screen.queryByTestId("day-policy-reminder")).toBeNull();
    expect(screen.queryByTestId("transport-segment")).toBeNull();
  });
});