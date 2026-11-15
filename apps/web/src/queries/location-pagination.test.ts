import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { amapLocationsQueryOptions, savedLocationsQueryOptions, type Page } from "./admin-locations";
import {
  amapParamsFromPagination,
  amapTablePageMetadata,
  initialLocationPagination,
  isAmapPageReachable,
  paginationFromApiPage,
  resetPaginationForFilterChange,
  savedLocationParamsFromPagination,
  savedLocationTablePageMetadata,
} from "./location-pagination";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("admin location pagination adapter", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps zero-based table pagination to one-based API pages for both lists", async () => {
    const amapPage: Page<never> = {
      page: 3,
      pageSize: 25,
      totalElements: 200,
      totalPages: 8,
      hasNext: true,
      hasPrevious: true,
      items: [],
    };
    const savedPage: Page<never> = {
      page: 4,
      pageSize: 10,
      totalElements: 87,
      totalPages: 9,
      hasNext: true,
      hasPrevious: true,
      items: [],
    };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(amapPage))
      .mockResolvedValueOnce(jsonResponse(savedPage));

    const amapParams = amapParamsFromPagination(
      { regionCode: "310000", typeGroup: "attraction" },
      { pageIndex: 2, pageSize: 25 },
    );
    const savedParams = savedLocationParamsFromPagination(
      { regionCode: "310100", typeGroup: "attraction" },
      { pageIndex: 3, pageSize: 10 },
    );
    await new QueryClient().fetchQuery(amapLocationsQueryOptions(amapParams));
    await new QueryClient().fetchQuery(savedLocationsQueryOptions(savedParams));

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "/api/admin/locations/amap?regionCode=310000&typeGroup=attraction&page=3&pageSize=25",
    );
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      "/api/admin/locations?regionCode=310100&typeGroup=attraction&page=4&pageSize=10",
    );
  });

  it("starts each table at page one and resets its page when filters change", () => {
    expect(initialLocationPagination()).toEqual({ pageIndex: 0, pageSize: 10 });
    expect(paginationFromApiPage({ page: 4, pageSize: 25 })).toEqual({
      pageIndex: 3,
      pageSize: 25,
    });
    expect(resetPaginationForFilterChange({ pageIndex: 6, pageSize: 25 })).toEqual({
      pageIndex: 0,
      pageSize: 25,
    });
  });

  it("caps Amap rows at 200 and disables next-page access at the boundary", () => {
    const page: Page<never> = {
      page: 8,
      pageSize: 25,
      totalElements: 320,
      totalPages: 13,
      hasNext: true,
      hasPrevious: true,
      items: [],
    };

    expect(amapTablePageMetadata(page)).toEqual({
      rowCount: 200,
      pageCount: 8,
      hasNext: false,
      hasPrevious: true,
      totalIsExact: true,
    });
    expect(savedLocationTablePageMetadata(page).rowCount).toBe(320);
    expect(isAmapPageReachable({ page: 8, pageSize: 25 })).toBe(true);
    expect(isAmapPageReachable({ page: 9, pageSize: 25 })).toBe(false);
  });

  it("keeps Amap pagination available when a full page is reported as the total count", () => {
    const firstPage: Page<{ id: number }> = {
      page: 1,
      pageSize: 10,
      totalElements: 10,
      totalPages: 1,
      hasNext: false,
      hasPrevious: false,
      items: Array.from({ length: 10 }, (_, id) => ({ id })),
    };
    const secondPage: Page<{ id: number }> = {
      ...firstPage,
      page: 2,
      hasPrevious: true,
      items: Array.from({ length: 10 }, (_, id) => ({ id: id + 10 })),
    };

    expect(amapTablePageMetadata(firstPage)).toEqual({
      rowCount: 10,
      pageCount: 2,
      hasNext: true,
      hasPrevious: false,
      totalIsExact: false,
    });
    expect(amapTablePageMetadata(secondPage)).toEqual({
      rowCount: 20,
      pageCount: 3,
      hasNext: true,
      hasPrevious: true,
      totalIsExact: false,
    });
  });

  it("rejects an unreachable Amap page without sending a request", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await expect(
      queryClient.fetchQuery(amapLocationsQueryOptions({
        typeGroup: "attraction",
        page: 9,
        pageSize: 25,
      })),
    ).rejects.toThrow("200-result limit");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
