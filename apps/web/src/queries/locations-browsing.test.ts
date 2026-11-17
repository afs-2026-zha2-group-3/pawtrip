import { describe, expect, it, vi } from "vitest";
import {
  locationBrowseDetailQueryOptions,
  locationQueryKeys,
  locationTypesQueryOptions,
  locationsQueryOptions,
  mapLocationsQueryOptions,
  nearbyPetServicesQueryOptions,
} from "./locations";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("location browsing queries", () => {
  it("includes region, type, pet-friendly filter and pagination in list query keys", () => {
    const params = {
      regionCode: "440400",
      typeGroup: "hotel",
      petFriendlyOnly: true,
      page: 2,
      pageSize: 20,
    };

    expect(locationsQueryOptions(params).queryKey).toEqual([
      "locations",
      "list",
      {
        regionCode: "440400",
        typeGroup: "hotel",
        petFriendlyOnly: true,
        nearPoiId: null,
        page: 2,
        pageSize: 20,
      },
    ]);
    expect(locationQueryKeys.detail("poi-a")).toEqual([
      "locations",
      "detail",
      "poi-a",
    ]);
  });

  it("builds shared type, list and detail URLs", async () => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ items: [] })));

    await locationTypesQueryOptions().queryFn?.({
      signal: new AbortController().signal,
    } as never);
    await locationsQueryOptions({
      regionCode: "440400",
      typeGroup: "hotel",
      petFriendlyOnly: false,
      page: 1,
      pageSize: 20,
    }).queryFn?.({ signal: new AbortController().signal } as never);
    await locationBrowseDetailQueryOptions("poi/a").queryFn?.({
      signal: new AbortController().signal,
    } as never);

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/locations/types",
      "/api/locations?regionCode=440400&typeGroup=hotel&petFriendlyOnly=false&page=1&pageSize=20",
      "/api/locations/poi%2Fa",
    ]);

    vi.unstubAllGlobals();
  });

  it("includes the nearby anchor in list query keys and URLs", async () => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ items: [] })));

    const options = locationsQueryOptions({
      regionCode: "440400",
      typeGroup: "restaurant",
      petFriendlyOnly: true,
      nearPoiId: "poi-anchor",
      page: 1,
      pageSize: 20,
    });

    expect(options.queryKey).toEqual([
      "locations",
      "list",
      {
        regionCode: "440400",
        typeGroup: "restaurant",
        petFriendlyOnly: true,
        nearPoiId: "poi-anchor",
        page: 1,
        pageSize: 20,
      },
    ]);
    await options.queryFn?.({ signal: new AbortController().signal } as never);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/locations?regionCode=440400&typeGroup=restaurant&petFriendlyOnly=true&nearPoiId=poi-anchor&page=1&pageSize=20",
    );

    vi.unstubAllGlobals();
  });

  it("fetches all filtered pages for map points", async () => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          page: 1,
          pageSize: 100,
          totalElements: 2,
          totalPages: 2,
          hasNext: true,
          hasPrevious: false,
          items: [{ poiId: "poi-a" }],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          page: 2,
          pageSize: 100,
          totalElements: 2,
          totalPages: 2,
          hasNext: false,
          hasPrevious: true,
          items: [{ poiId: "poi-b" }],
        }),
      );

    const items = await mapLocationsQueryOptions({
      regionCode: "440400",
      typeGroup: "hotel",
      petFriendlyOnly: true,
      nearPoiId: "poi-anchor",
    }).queryFn?.({ signal: new AbortController().signal } as never);

    expect(items?.map((item) => item.poiId)).toEqual(["poi-a", "poi-b"]);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "/api/locations?regionCode=440400&typeGroup=hotel&petFriendlyOnly=true&nearPoiId=poi-anchor&page=1&pageSize=100",
      "/api/locations?regionCode=440400&typeGroup=hotel&petFriendlyOnly=true&nearPoiId=poi-anchor&page=2&pageSize=100",
    ]);

    vi.unstubAllGlobals();
  });

  it("builds the nearby pet services URL", async () => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ hospital: null, supplies: null })),
    );

    const data = await nearbyPetServicesQueryOptions("poi/a").queryFn?.({
      signal: new AbortController().signal,
    } as never);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/locations/poi%2Fa/nearby-services",
    );
    expect(data).toEqual({ hospital: null, supplies: null });

    vi.unstubAllGlobals();
  });
});
