import { describe, expect, it, vi } from "vitest";
import {
  locationBrowseDetailQueryOptions,
  locationQueryKeys,
  locationTypesQueryOptions,
  locationsQueryOptions,
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
});
