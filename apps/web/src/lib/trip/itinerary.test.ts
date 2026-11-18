import { describe, expect, it } from "vitest";
import {
  addDays,
  buildItinerary,
  formatTripDate,
  type ItineraryPet,
} from "./itinerary";
import type { LocationBrowseDetail } from "@/queries/locations";
import type { Trip } from "./types";

const pet: ItineraryPet = { hasLeash: true, weightKg: 4.5, shoulderHeightCm: 25 };

function location(
  poiId: string,
  name: string,
  overrides: Partial<LocationBrowseDetail> = {},
): LocationBrowseDetail {
  return {
    poiId,
    name,
    typeCode: "110000",
    typeGroup: "attraction",
    address: "珠海市香洲区",
    regionCode: "440402",
    petPolicies: {
      allowedPetTypes: "DOG",
      maxPetsPerPerson: 1,
      maxSinglePetWeightKg: null,
      maxSinglePetShoulderHeightCm: null,
      leashRequired: true,
      vaccinationProofRequired: null,
      extraFeeCents: null,
      reservationRequired: null,
    },
    coverPhotoUrl: null,
    rating: null,
    ...overrides,
  };
}

const trip: Trip = {
  id: 1,
  name: "珠海 · 2天 · 豆豆",
  cityAdcode: "440400",
  petId: 1,
  totalDays: 2,
  startDate: "2026-12-31",
  transportMode: "high_speed_rail",
  planCompleted: true,
  plan: {
    version: 1,
    days: [
      {
        day: 1,
        stops: [
          { poiId: "poi-a", toNextEstimate: { durationMinutes: 20, costLowYuan: 27, costHighYuan: 40 } },
          { poiId: "poi-b" },
        ],
      },
      { day: 2, stops: [] },
    ],
    unscheduled: [{ poiId: "poi-c" }],
  },
  createdAt: "2026-11-17T00:00:00Z",
  updatedAt: "2026-11-17T00:00:00Z",
};

const locations = {
  "poi-a": location("poi-a", "情侣路"),
  "poi-b": location("poi-b", "珠海渔女"),
  "poi-c": location("poi-c", "珠海海滨公园"),
};

describe("addDays", () => {
  it("跨月与跨年按自然日推进", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-12-01", 6)).toBe("2026-12-07");
  });

  it("非法日期返回 null", () => {
    expect(addDays("2026/12/01", 1)).toBeNull();
  });
});

describe("formatTripDate", () => {
  it("输出月日与星期", () => {
    expect(formatTripDate("2026-12-01")).toBe("12月1日 周二");
    expect(formatTripDate("2027-01-01")).toBe("1月1日 周五");
  });
});

describe("buildItinerary", () => {
  it("按天生成日期、城市与地点/交通时间线", () => {
    const itinerary = buildItinerary(trip, "珠海市", locations, pet);

    expect(itinerary.days).toHaveLength(2);
    expect(itinerary.days[0]).toMatchObject({
      day: 1,
      dateLabel: "12月31日 周四",
      city: "珠海市",
    });
    expect(itinerary.days[0].entries.map((entry) => entry.kind)).toEqual([
      "stop",
      "transport",
      "stop",
    ]);
    const [firstStop, transport] = itinerary.days[0].entries;
    expect(firstStop).toMatchObject({
      kind: "stop",
      poiId: "poi-a",
      name: "情侣路",
      address: "珠海市香洲区",
      policy: { leashRequired: true },
    });
    expect(transport).toMatchObject({
      kind: "transport",
      label: "打车",
      estimate: { durationMinutes: 20, costLowYuan: 27, costHighYuan: 40 },
      fromPoiId: "poi-a",
      toPoiId: "poi-b",
      displayMode: "drive",
    });
    expect(itinerary.days[1]).toMatchObject({
      day: 2,
      dateLabel: "1月1日 周五",
      entries: [],
    });
  });

  it("汇总当天提醒与未排期地点", () => {
    const itinerary = buildItinerary(trip, "珠海市", locations, pet);

    expect(itinerary.days[0].policyLines).toContain("当天需携带牵引绳");
    expect(itinerary.unscheduledNames).toEqual(["珠海海滨公园"]);
  });

  it("没有开始日期时不生成日期标签", () => {
    const itinerary = buildItinerary(
      { ...trip, startDate: null },
      "珠海市",
      locations,
      pet,
    );

    expect(itinerary.days.every((day) => day.dateLabel === null)).toBe(true);
  });
});
