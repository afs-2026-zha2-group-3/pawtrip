import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminLocationQueryKeys,
  amapLocationsQueryOptions,
  createLocation,
  createLocationMutationOptions,
  locationDetailQueryOptions,
  savedLocationsQueryOptions,
  updateLocation,
  updateLocationMutationOptions,
  type LocationDetail,
  type Page,
} from "./admin-locations";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin location queries", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes each list filter and pagination field in distinct query keys", () => {
    const amapParams = { regionCode: "310000", typeGroup: "attraction", page: 3, pageSize: 25 };
    const savedParams = { regionCode: "310100", typeGroup: "attraction", page: 2, pageSize: 10 };

    expect(amapLocationsQueryOptions(amapParams).queryKey).toEqual(
      adminLocationQueryKeys.amapList(amapParams),
    );
    expect(amapLocationsQueryOptions(amapParams).queryKey).toEqual([
      "admin",
      "locations",
      "amap",
      { regionCode: "310000", typeGroup: "attraction", page: 3, pageSize: 25 },
    ]);
    expect(savedLocationsQueryOptions(savedParams).queryKey).toEqual([
      "admin",
      "locations",
      "saved",
      { regionCode: "310100", typeGroup: "attraction", page: 2, pageSize: 10 },
    ]);
  });

  it("passes the TanStack Query abort signal through the shared request helper", async () => {
    fetchMock.mockImplementation((_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
      }),
    );

    const queryClient = new QueryClient();
    const options = amapLocationsQueryOptions({
      regionCode: "310000",
      typeGroup: "attraction",
      page: 1,
      pageSize: 10,
    });
    const result = queryClient.fetchQuery(options);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());

    await queryClient.cancelQueries({ queryKey: options.queryKey });

    const requestSignal = fetchMock.mock.calls[0]?.[1]?.signal;
    expect(requestSignal?.aborted).toBe(true);
    await result.catch(() => undefined);
  });

  it("serializes all list params and preserves the server page response", async () => {
    const page: Page<never> = {
      page: 4,
      pageSize: 25,
      totalElements: 87,
      totalPages: 4,
      hasNext: false,
      hasPrevious: true,
      items: [],
    };
    fetchMock.mockResolvedValue(jsonResponse(page));

    const result = await new QueryClient().fetchQuery(
      amapLocationsQueryOptions({
        regionCode: "310000",
        typeGroup: "attraction",
        page: 4,
        pageSize: 25,
      }),
    );

    expect(result).toEqual(page);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/locations/amap?regionCode=310000&typeGroup=attraction&page=4&pageSize=25",
      expect.objectContaining({ method: "GET", signal: expect.any(AbortSignal) }),
    );
  });

  it("reads saved-location data from the database list endpoint", async () => {
    fetchMock.mockResolvedValue(jsonResponse({
      page: 1,
      pageSize: 10,
      totalElements: 0,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false,
      items: [],
    }));

    await new QueryClient().fetchQuery(
      savedLocationsQueryOptions({ page: 1, pageSize: 10 }),
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/locations?page=1&pageSize=10",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("returns saved photo source URLs from the JSON detail endpoint", async () => {
    const detail: LocationDetail = {
      poiId: "poi/1",
      typeGroup: "attraction",
      minVisitHours: null,
      maxVisitHours: null,
      poi: { name: "Park" },
      business: {},
      photos: [{
        photoId: 7,
        order: 0,
        title: "Main gate",
        sourceUrl: "https://images.example.test/gate.jpg",
        metadata: { url: "https://images.example.test/gate.jpg" },
      }],
    };
    fetchMock.mockResolvedValue(jsonResponse(detail));

    const result = await new QueryClient().fetchQuery(locationDetailQueryOptions("poi/1"));

    expect(result.photos[0]?.sourceUrl).toBe("https://images.example.test/gate.jpg");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/locations/poi%2F1",
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it("returns POST and PATCH details for direct query-cache updates", async () => {
    const detail: LocationDetail = {
      poiId: "poi-1",
      typeGroup: "attraction",
      minVisitHours: 2,
      maxVisitHours: 5,
      poi: { name: "地点" },
      business: {},
      photos: [],
    };
    const updatedDetail = { ...detail, minVisitHours: 3, maxVisitHours: 6 };
    vi.stubGlobal("document", { cookie: "XSRF-TOKEN=test-token" });
    fetchMock
      .mockResolvedValueOnce(jsonResponse(detail))
      .mockResolvedValueOnce(jsonResponse(updatedDetail));

    expect(createLocationMutationOptions().mutationFn).toBe(createLocation);
    const created = await createLocation({
      poiId: "poi-1",
      typeGroup: "attraction",
      minVisitHours: 2,
      maxVisitHours: 5,
    });
    expect(created).toEqual(detail);
    const cache = new QueryClient();
    cache.setQueryData(adminLocationQueryKeys.detail(created.poiId), created);
    expect(cache.getQueryData(adminLocationQueryKeys.detail("poi-1"))).toEqual(detail);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/admin/locations",
      expect.objectContaining({ method: "POST", body: JSON.stringify({
        poiId: "poi-1",
        typeGroup: "attraction",
        minVisitHours: 2,
        maxVisitHours: 5,
      }) }),
    );

    expect(updateLocationMutationOptions("poi-1").mutationFn).toBeDefined();
    const updated = await updateLocation("poi-1", { minVisitHours: 3, maxVisitHours: 6 });
    expect(updated).toEqual(updatedDetail);
    cache.setQueryData(adminLocationQueryKeys.detail(updated.poiId), updated);
    expect(cache.getQueryData(adminLocationQueryKeys.detail("poi-1"))).toEqual(updatedDetail);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/admin/locations/poi-1",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ minVisitHours: 3, maxVisitHours: 6 }) }),
    );
  });


});
