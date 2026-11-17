// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransportSegmentRow } from "./transport-segment";
import { createQueryClient } from "@/lib/query-client";
import {
  ESTIMATE_LOADING_TEXT,
  ESTIMATE_UNAVAILABLE_TEXT,
  SAME_POI_NOTE,
  TAXI_PET_HINT,
  buildDaySegments,
} from "@/lib/trip/transport-segments";
import { tripActions, tripStore } from "@/lib/trip/store";
import type { StopRef } from "@/lib/trip/plan";
import type { ToNextEstimate, Trip, TripPlan, TripStop } from "@/lib/trip/types";
import type { TransportMode } from "@/data/transport-rules";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

const DRIVE_BODY = { mode: "drive", durationMinutes: 47, costLowYuan: 101.6, costHighYuan: 152.4 };
const WALK_BODY = { mode: "walk", durationMinutes: 508, costLowYuan: 0, costHighYuan: 0 };
const DRIVE_SNAPSHOT: ToNextEstimate = { durationMinutes: 25, costLowYuan: 40, costHighYuan: 60 };

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function tripWith(stops: TripStop[], transportMode: TransportMode | null = null): Trip {
  const plan: TripPlan = { version: 1, days: [{ day: 1, stops }], unscheduled: [] };
  return {
    id: 7,
    name: "杭州 · 3天 · 旺财",
    cityAdcode: "330100",
    petId: 1,
    totalDays: 3,
    startDate: null,
    transportMode,
    plan,
    createdAt: "2026-11-17T00:00:00Z",
    updatedAt: "2026-11-17T00:00:00Z",
  };
}

const REF: StopRef = { container: 1, index: 0 };

// 共享 Select（base-ui）交互：点开 combobox 后按文案选中 option
async function chooseMode(name: string, label: string) {
  await userEvent.click(screen.getByRole("combobox", { name }));
  await userEvent.click(await screen.findByRole("option", { name: label }));
}

function renderRow(options: {
  stop?: TripStop;
  toPoiId?: string;
  transportMode?: TransportMode | null;
  compact?: boolean;
}) {
  const stop = options.stop ?? { poiId: "poi-a" };
  const transportMode = options.transportMode ?? null;
  tripActions.setActive(tripWith([stop, { poiId: options.toPoiId ?? "poi-b" }], transportMode));
  const segment = buildDaySegments(
    [stop, { poiId: options.toPoiId ?? "poi-b" }],
    transportMode,
  )[0];
  const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <TransportSegmentRow
        tripId={7}
        stopRef={REF}
        segment={segment}
        transportMode={transportMode}
      compact={options.compact}
      />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  tripActions.resetForTests();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("snapshot-first display", () => {
  it("shows the saved taxi snapshot without any estimate request", () => {
    renderRow({ stop: { poiId: "poi-a", toNext: "drive", toNextEstimate: DRIVE_SNAPSHOT } });

    expect(screen.getByTestId("segment-mode").textContent).toBe("打车");
    expect(screen.getByText("约 25 分钟")).toBeTruthy();
    expect(screen.getByText("¥40–60")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows duration only for a saved self_drive snapshot", () => {
    renderRow({
      stop: { poiId: "poi-a", toNext: "self_drive", toNextEstimate: { durationMinutes: 47, costLowYuan: 0, costHighYuan: 0 } },
    });

    expect(screen.getByTestId("segment-mode").textContent).toBe("驾车");
    expect(screen.getByText("约 47 分钟")).toBeTruthy();
    expect(screen.queryByText(/¥/)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows ¥0 for a saved walking snapshot", () => {
    renderRow({
      stop: { poiId: "poi-a", toNext: "walk", toNextEstimate: { durationMinutes: 508, costLowYuan: 0, costHighYuan: 0 } },
    });

    expect(screen.getByTestId("segment-mode").textContent).toBe("步行");
    expect(screen.getByText("约 508 分钟")).toBeTruthy();
    expect(screen.getByText("¥0")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("live estimate without a snapshot", () => {
  it("shows loading then the taxi estimate for the derived default without writing the store", async () => {
    fetchMock.mockResolvedValue(jsonResponse(DRIVE_BODY));
    const revision = tripStore.state.saveRevision;
    renderRow({});

    expect(screen.getByText(ESTIMATE_LOADING_TEXT)).toBeTruthy();
    expect(await screen.findByText("约 47 分钟")).toBeTruthy();
    expect(screen.getByText("¥101.6–152.4")).toBeTruthy();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/trips/7/route-estimate?fromPoiId=poi-a&toPoiId=poi-b&mode=drive",
    );
    const stop = tripStore.state.active!.plan.days[0].stops[0];
    expect(stop.toNext ?? null).toBeNull();
    expect(stop.toNextEstimate ?? null).toBeNull();
    expect(tripStore.state.saveRevision).toBe(revision);
  });

  it("derives self_drive in drive mode, requests mode=drive and shows duration only", async () => {
    fetchMock.mockResolvedValue(jsonResponse(DRIVE_BODY));
    renderRow({ transportMode: "drive" });

    expect(await screen.findByText("约 47 分钟")).toBeTruthy();
    expect(screen.getByTestId("segment-mode").textContent).toBe("驾车");
    expect(screen.queryByText(/¥/)).toBeNull();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/trips/7/route-estimate?fromPoiId=poi-a&toPoiId=poi-b&mode=drive",
    );
    expect(tripStore.state.active!.plan.days[0].stops[0].toNext ?? null).toBeNull();
  });

  it("backfills the snapshot after a successful query for a saved mode", async () => {
    fetchMock.mockResolvedValue(jsonResponse(DRIVE_BODY));
    renderRow({ stop: { poiId: "poi-a", toNext: "drive", toNextEstimate: null } });

    await waitFor(() => {
      expect(tripStore.state.active!.plan.days[0].stops[0].toNextEstimate).toEqual({
        durationMinutes: 47,
        costLowYuan: 101.6,
        costHighYuan: 152.4,
      });
    });
  });

  it("backfills a saved self_drive mode with zero costs", async () => {
    fetchMock.mockResolvedValue(jsonResponse(DRIVE_BODY));
    renderRow({ stop: { poiId: "poi-a", toNext: "self_drive", toNextEstimate: null } });

    await waitFor(() => {
      expect(tripStore.state.active!.plan.days[0].stops[0].toNextEstimate).toEqual({
        durationMinutes: 47,
        costLowYuan: 0,
        costHighYuan: 0,
      });
    });
    expect(screen.queryByText(/¥/)).toBeNull();
  });

  it("shows the fallback text on failure and still allows mode-only selection", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ code: "UPSTREAM_FAILURE" }, 502));
    renderRow({});

    expect(await screen.findByText(ESTIMATE_UNAVAILABLE_TEXT)).toBeTruthy();
    await chooseMode("选择途内交通方式", "步行");

    const stop = tripStore.state.active!.plan.days[0].stops[0];
    expect(stop.toNext).toBe("walk");
    expect(stop.toNextEstimate).toBeNull();
  });

  it("keeps the fallback local under the production query-client throwOnError policy", async () => {
    // 回归：全局 createQueryClient 默认 throwOnError 会把无数据的失败查询抛给路由错误边界，
    // 导致整页崩溃（E2E E2/E9/E11 发现）；估算失败必须留在段行内兜底。
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ code: "UPSTREAM_FAILURE" }, 502)));
    const stop: TripStop = { poiId: "poi-a" };
    tripActions.setActive(tripWith([stop, { poiId: "poi-b" }]));
    const segment = buildDaySegments([stop, { poiId: "poi-b" }], null)[0];
    render(
      <QueryClientProvider client={createQueryClient()}>
        <TransportSegmentRow tripId={7} stopRef={REF} segment={segment} transportMode={null} />
      </QueryClientProvider>,
    );

    expect(await screen.findByText(ESTIMATE_UNAVAILABLE_TEXT, undefined, { timeout: 8000 })).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "选择途内交通方式" })).toBeTruthy();
  }, 10000);
});

describe("mode selection", () => {
  it("shows an inline small-transport placeholder in compact mode", () => {
    renderRow({ compact: true });

    expect(screen.getByText("点击此处选择小交通")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "选择途内交通方式" })).toBeTruthy();
  });

  it("offers only taxi and walking for public transport", async () => {
    renderRow({ stop: { poiId: "poi-a", toNext: "drive", toNextEstimate: DRIVE_SNAPSHOT } });
    await userEvent.click(screen.getByRole("combobox", { name: "选择途内交通方式" }));
    const labels = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(labels).toEqual(["打车", "步行"]);
  });

  it("offers the drive-mode dropdown with taxi, walking and explicit driving", async () => {
    renderRow({
      transportMode: "drive",
      stop: { poiId: "poi-a", toNext: "drive", toNextEstimate: DRIVE_SNAPSHOT },
    });
    await userEvent.click(screen.getByRole("combobox", { name: "选择其他途内交通方式" }));
    const labels = (await screen.findAllByRole("option")).map((option) => option.textContent);
    expect(labels).toEqual(["打车", "步行", "驾车"]);

    await userEvent.click(screen.getByRole("option", { name: "驾车" }));
    const stop = tripStore.state.active!.plan.days[0].stops[0];
    expect(stop.toNext).toBe("self_drive");
  });

  it("clears the old snapshot on switching and re-estimates for the new mode", async () => {
    fetchMock.mockResolvedValue(jsonResponse(WALK_BODY));
    renderRow({ stop: { poiId: "poi-a", toNext: "drive", toNextEstimate: DRIVE_SNAPSHOT } });
    expect(fetchMock).not.toHaveBeenCalled();

    await chooseMode("选择途内交通方式", "步行");
    // 切换瞬间的快照清空由 store-transport.test.ts 确定性覆盖；这里 mock 立即成功，回填可能已完成
    const stop = tripStore.state.active!.plan.days[0].stops[0];
    expect(stop.toNext).toBe("walk");

    expect(await screen.findByText("约 508 分钟")).toBeTruthy();
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/trips/7/route-estimate?fromPoiId=poi-a&toPoiId=poi-b&mode=walk",
    );
    await waitFor(() => {
      expect(tripStore.state.active!.plan.days[0].stops[0].toNextEstimate).toEqual({
        durationMinutes: 508,
        costLowYuan: 0,
        costHighYuan: 0,
      });
    });
  });
});

describe("hints and same-poi segments", () => {
  it("shows the taxi pet hint for the derived default taxi display", () => {
    fetchMock.mockResolvedValue(jsonResponse(DRIVE_BODY));
    renderRow({});
    expect(screen.getByText(TAXI_PET_HINT)).toBeTruthy();
  });

  it("shows the taxi pet hint for a taxi segment switched in drive mode", () => {
    renderRow({
      transportMode: "drive",
      stop: { poiId: "poi-a", toNext: "drive", toNextEstimate: DRIVE_SNAPSHOT },
    });
    expect(screen.getByText(TAXI_PET_HINT)).toBeTruthy();
  });

  it("hides the taxi pet hint for walking and driving segments", () => {
    renderRow({
      stop: { poiId: "poi-a", toNext: "walk", toNextEstimate: { durationMinutes: 508, costLowYuan: 0, costHighYuan: 0 } },
    });
    expect(screen.queryByText(TAXI_PET_HINT)).toBeNull();

    cleanup();
    renderRow({ transportMode: "drive" });
    expect(screen.queryByText(TAXI_PET_HINT)).toBeNull();
  });

  it("renders only the same-poi note without selector, estimate or request", () => {
    renderRow({ toPoiId: "poi-a" });

    expect(screen.getByText(SAME_POI_NOTE)).toBeTruthy();
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(screen.queryByText(/¥/)).toBeNull();
    expect(screen.queryByText(/分钟/)).toBeNull();
    expect(screen.queryByText(TAXI_PET_HINT)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(tripStore.state.active!.plan.days[0].stops[0].toNext ?? null).toBeNull();
  });
});

describe("drag isolation", () => {
  it("renders no drag handle inside the segment row", () => {
    renderRow({ stop: { poiId: "poi-a", toNext: "drive", toNextEstimate: DRIVE_SNAPSHOT } });
    expect(screen.queryByRole("button", { name: /拖动/ })).toBeNull();
  });
});
