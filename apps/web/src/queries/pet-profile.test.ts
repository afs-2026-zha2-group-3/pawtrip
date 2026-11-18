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

  it("returns petType and breed from the first pet", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse([
        { id: 1, petType: "DOG", shoulderHeightCm: 40, dogBreed: { id: 7, name: "柯基犬", officialAggressive: false }, preferences: ["SWIMMING"], personality: "CALM" },
        { id: 2, petType: "CAT", shoulderHeightCm: 25, dogBreed: null },
      ]),
    );
    await expect(fetchPetProfile()).resolves.toEqual({
      petType: "DOG",
      breedId: 7,
      breedName: "柯基犬",
      shoulderHeightCm: 40,
      preferences: ["SWIMMING"],
      personality: "CALM",
    });
  });

  it("keeps null breed for a dog without breed or a cat", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 1, petType: "DOG", shoulderHeightCm: 40, dogBreed: null }]));
    await expect(fetchPetProfile()).resolves.toEqual({ petType: "DOG", breedId: null, breedName: null, shoulderHeightCm: 40, preferences: [], personality: null });

    fetchMock.mockResolvedValueOnce(jsonResponse([{ id: 1, petType: "CAT", shoulderHeightCm: 25, dogBreed: null }]));
    await expect(fetchPetProfile()).resolves.toEqual({ petType: "CAT", breedId: null, breedName: null, shoulderHeightCm: 25, preferences: [], personality: null });
  });

  it("degrades to no-profile when the request fails", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ code: "UNAUTHENTICATED", detail: "Authentication required" }, 401),
    );
    await expect(fetchPetProfile()).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(fetchPetProfile()).resolves.toBeNull();
  });

  it("degrades to no-profile for empty list", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
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
        policyCovered: false,
        bannedBreeds: [],
        allowedPetTypes: null,
        allowedDogBreedIds: [],
        maxSinglePetShoulderHeightCm: null,
      },
    ];
    fetchMock.mockResolvedValueOnce(jsonResponse(candidates));

    const options = destinationsQueryOptions();
    expect(options.queryKey).toEqual(["destinations", "", false, null, null, null]);
    const queryFn = options.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>;
    await expect(queryFn({})).resolves.toEqual(candidates);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/destinations");
  });

  it("passes keyword and petFriendly filters to the API", async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    const options = destinationsQueryOptions({ keyword: " 杭州 ", petFriendly: true });
    expect(options.queryKey).toEqual(["destinations", "杭州", true, null, null, null]);
    const queryFn = options.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>;
    await queryFn({});
    expect(fetchMock.mock.calls[0][0]).toBe("/api/destinations?keyword=%E6%9D%AD%E5%B7%9E&petFriendly=true");
  });

  it("passes petType and breedId only when the filter is on", async () => {
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse([])));
    const queryFn = (options: ReturnType<typeof destinationsQueryOptions>) =>
      options.queryFn as (context: { signal?: AbortSignal }) => Promise<unknown>;

    const on = destinationsQueryOptions({ petFriendly: true, petType: "DOG", breedId: 7, shoulderHeightCm: 45 });
    expect(on.queryKey).toEqual(["destinations", "", true, "DOG", 7, 45]);
    await queryFn(on)({});
    expect(fetchMock.mock.calls[0][0]).toBe("/api/destinations?petFriendly=true&petType=DOG&breedId=7&shoulderHeightCm=45");

    const off = destinationsQueryOptions({ petFriendly: false, petType: "DOG", breedId: 7, shoulderHeightCm: 45 });
    expect(off.queryKey).toEqual(["destinations", "", false, null, null, null]);
    await queryFn(off)({});
    expect(fetchMock.mock.calls[1][0]).toBe("/api/destinations");

    const cat = destinationsQueryOptions({ petFriendly: true, petType: "CAT", breedId: 7, shoulderHeightCm: 25 });
    expect(cat.queryKey).toEqual(["destinations", "", true, "CAT", null, 25]);
    await queryFn(cat)({});
    expect(fetchMock.mock.calls[2][0]).toBe("/api/destinations?petFriendly=true&petType=CAT&shoulderHeightCm=25");
  });
});