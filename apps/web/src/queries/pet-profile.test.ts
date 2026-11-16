import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPetProfile } from "./pet-profile";
import { destinationsQueryOptions } from "./destinations";

const fetchMock = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("pet profile adapter (external US-01 dependency)", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the breed from the external profile response", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ breed: "柯基" }]));
    await expect(fetchPetProfile()).resolves.toEqual({ breed: "柯基" });
  });

  it("degrades to no-profile when the request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: "UNAUTHENTICATED", detail: "Authentication required" }, 401),
    );
    await expect(fetchPetProfile()).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchPetProfile()).resolves.toBeNull();
  });

  it("degrades to no-profile when the endpoint does not exist yet", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ code: "NOT_FOUND" }, 404));
    await expect(fetchPetProfile()).resolves.toBeNull();
  });

  it("degrades to no-profile for empty list or missing breed", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    await expect(fetchPetProfile()).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(jsonResponse([{ weightKg: 12 }]));
    await expect(fetchPetProfile()).resolves.toBeNull();
  });
});

describe("destinations query", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches read-only candidates from /api/destinations", async () => {
    const candidates = [
      {
        adcode: "330100",
        name: "杭州市",
        province: "浙江省",
        policyCovered: true,
        bannedBreeds: [{ breedName: "比特犬", source: "s", updated: "2007-08-13" }],
      },
    ];
    fetchMock.mockResolvedValueOnce(jsonResponse(candidates));

    const options = destinationsQueryOptions();
    expect(options.queryKey).toEqual(["destinations", "", false]);
    const queryFn = options.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>;
    await expect(queryFn({})).resolves.toEqual(candidates);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/destinations");
  });

  it("passes keyword and petFriendly filters to the API", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const options = destinationsQueryOptions({ keyword: " 杭州 ", petFriendly: true });
    expect(options.queryKey).toEqual(["destinations", "杭州", true]);
    const queryFn = options.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>;
    await queryFn({});
    expect(fetchMock.mock.calls[0][0]).toBe("/api/destinations?keyword=%E6%9D%AD%E5%B7%9E&petFriendly=true");
  });
});