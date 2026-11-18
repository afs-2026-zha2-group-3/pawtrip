import { describe, expect, it, vi } from "vitest";
import type { LocationSummary, Page } from "@/queries/locations";
import {
  fetchLocationCatalog,
  isSameCity,
  matchLocationCatalog,
} from "./locations";

function summary(poiId: string, name: string, address: string | null = null): LocationSummary {
  return {
    poiId,
    name,
    address,
    typeCode: "110000",
    typeGroup: "attraction",
    longitude: null,
    latitude: null,
    regionCode: "440402",
    minVisitHours: null,
    maxVisitHours: null,
    maxPetsPerPerson: 1,
    distanceMeters: null,
    coverPhotoUrl: null,
    rating: null,
    keytag: null,
    petPolicies: {
      allowedPetTypes: "DOG",
      maxPetsPerPerson: 1,
      maxSinglePetWeightKg: null,
      maxSinglePetShoulderHeightCm: null,
      leashRequired: null,
      vaccinationProofRequired: null,
      extraFeeCents: null,
      reservationRequired: null,
    },
  };
}

function page(items: LocationSummary[], pageNumber: number, hasNext: boolean, total: number): Page<LocationSummary> {
  return {
    page: pageNumber,
    pageSize: 100,
    totalElements: total,
    totalPages: Math.ceil(total / 100),
    hasNext,
    hasPrevious: pageNumber > 1,
    items,
  };
}

describe("agent location catalog", () => {
  it("paginates with pageSize=100 until the last page", async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce(page([summary("a", "甲")], 1, true, 150))
      .mockResolvedValueOnce(page([summary("b", "乙")], 2, false, 150));

    const catalog = await fetchLocationCatalog("440400", { fetchPage });

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 1, 100);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 100);
    expect(catalog.items.map((item) => item.poiId)).toEqual(["a", "b"]);
    expect(catalog.truncated).toBe(false);
    expect(catalog.totalElements).toBe(150);
  });

  it("stops at the page limit and reports truncation", async () => {
    const fetchPage = vi.fn(async (pageNumber: number) =>
      page([summary(`p${pageNumber}`, `地点${pageNumber}`)], pageNumber, true, 5000),
    );

    const catalog = await fetchLocationCatalog("440400", {
      fetchPage,
      maxPages: 3,
    });

    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(catalog.truncated).toBe(true);
    expect(catalog.items).toHaveLength(3);
  });

  it("matches exact names first and flags ambiguity", () => {
    const items = [
      summary("a", "珠海渔女"),
      summary("b", "珠海渔女"),
      summary("c", "珠海海滨公园"),
      summary("d", "某酒店", "珠海市香洲区情侣路"),
    ];

    const exact = matchLocationCatalog(items, "珠海渔女");
    expect(exact.candidates.map((item) => item.poiId)).toEqual(["a", "b"]);
    expect(exact.ambiguous).toBe(true);

    const partial = matchLocationCatalog(items, "情侣路");
    expect(partial.candidates.map((item) => item.poiId)).toEqual(["d"]);
    expect(partial.ambiguous).toBe(false);

    const empty = matchLocationCatalog(items, "不存在");
    expect(empty.candidates).toEqual([]);
    expect(empty.totalMatched).toBe(0);
  });

  it("treats a district region code as the same city", () => {
    expect(isSameCity("440402", "440400")).toBe(true);
    expect(isSameCity("330106", "440400")).toBe(false);
    expect(isSameCity(null, "440400")).toBe(false);
  });
});
