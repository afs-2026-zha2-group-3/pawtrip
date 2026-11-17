import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { routeEstimateQueryOptions } from "./trips";
import type { RouteEstimateResponse } from "./trips";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const DRIVE_BODY: RouteEstimateResponse = {
  mode: "drive",
  durationMinutes: 47,
  costLowYuan: 101.6,
  costHighYuan: 152.4,
};

describe("route estimate query", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a segment-scoped cache key", () => {
    const options = routeEstimateQueryOptions(7, "poi-a", "poi-b", "drive");
    expect(options.queryKey).toEqual(["trips", "route-estimate", 7, "poi-a", "poi-b", "drive"]);

    const walk = routeEstimateQueryOptions(7, "poi-a", "poi-b", "walk");
    expect(walk.queryKey).toEqual(["trips", "route-estimate", 7, "poi-a", "poi-b", "walk"]);
  });

  it("fetches the estimate endpoint and returns the parsed body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(DRIVE_BODY));

    const options = routeEstimateQueryOptions(7, "poi-a", "poi-b", "drive");
    const queryFn = options.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>;
    await expect(queryFn({})).resolves.toEqual(DRIVE_BODY);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/trips/7/route-estimate?fromPoiId=poi-a&toPoiId=poi-b&mode=drive",
    );
  });

  it("url-encodes poi ids", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ mode: "walk", durationMinutes: 508, costLowYuan: 0, costHighYuan: 0 }),
    );

    const options = routeEstimateQueryOptions(7, "B0FF/a b", "poi&c", "walk");
    const queryFn = options.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>;
    await queryFn({});
    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/trips/7/route-estimate?fromPoiId=B0FF%2Fa%20b&toPoiId=poi%26c&mode=walk",
    );
  });

  it("retries once and caches for five minutes", () => {
    const options = routeEstimateQueryOptions(7, "poi-a", "poi-b", "drive");
    expect(options.retry).toBe(1);
    expect(options.staleTime).toBe(300_000);
  });

  it("is enabled by default and honours an explicit enabled flag", () => {
    expect(routeEstimateQueryOptions(7, "poi-a", "poi-b", "drive").enabled).toBe(true);
    expect(routeEstimateQueryOptions(7, "poi-a", "poi-b", "drive", { enabled: true }).enabled).toBe(true);
    expect(routeEstimateQueryOptions(7, "poi-a", "poi-b", "drive", { enabled: false }).enabled).toBe(false);
  });
});