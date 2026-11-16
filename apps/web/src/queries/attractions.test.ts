import { describe, expect, it, vi } from "vitest";
import { attractionDetailQueryOptions, attractionsQueryOptions } from "./attractions";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("attraction queries", () => {
  it("includes region, toggle and pagination in query keys", () => {
    const params = { regionCode: "440400", includeWithoutRules: true, page: 2, pageSize: 20 };
    expect(attractionsQueryOptions(params).queryKey).toEqual([
      "attractions",
      "440400",
      true,
      2,
      20,
    ]);
    expect(attractionDetailQueryOptions("poi-a").queryKey).toEqual([
      "attractions",
      "detail",
      "poi-a",
    ]);
  });

  it("builds the public list and detail URLs", async () => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ items: [] })));

    await attractionsQueryOptions({
      regionCode: "440400",
      includeWithoutRules: false,
      page: 1,
      pageSize: 20,
    }).queryFn?.({ signal: new AbortController().signal } as never);
    await attractionDetailQueryOptions("poi-a").queryFn?.({
      signal: new AbortController().signal,
    } as never);

    expect(fetchMock.mock.calls[0][0]).toBe(
      "/api/locations/attractions?regionCode=440400&includeWithoutRules=false&page=1&pageSize=20",
    );
    expect(fetchMock.mock.calls[1][0]).toBe("/api/locations/poi-a");

    vi.unstubAllGlobals();
  });
});
