import { describe, expect, it } from "vitest";
import type { LocationBrowseDetail } from "@/queries/locations";
import type { ItineraryDayLine, ItineraryEntry } from "./itinerary";
import {
  buildDayRoute,
  formatRouteDistance,
  formatRouteDuration,
  formatRouteLabel,
  routeMinutesFromSeconds,
} from "./day-route";

function stop(
  key: string,
  poiId: string,
  name: string,
): Extract<ItineraryEntry, { kind: "stop" }> {
  return { kind: "stop", key, poiId, name, address: null, policy: null };
}

function transport(
  key: string,
  fromPoiId: string,
  toPoiId: string,
  displayMode: "walk" | "drive" | "self_drive",
  durationMinutes?: number,
): Extract<ItineraryEntry, { kind: "transport" }> {
  return {
    kind: "transport",
    key,
    label: displayMode,
    estimate:
      durationMinutes == null
        ? null
        : { durationMinutes, costLowYuan: 0, costHighYuan: 0 },
    fromPoiId,
    toPoiId,
    displayMode,
  };
}

function dayWith(entries: ItineraryEntry[]): ItineraryDayLine {
  return {
    day: 1,
    dateLabel: "12月1日 周二",
    city: "珠海",
    entries,
    policyLines: [],
  };
}

function location(
  poiId: string,
  name: string,
  longitude: number | null,
  latitude: number | null,
): LocationBrowseDetail {
  return {
    poiId,
    name,
    typeCode: "110000",
    typeGroup: "attraction",
    address: null,
    longitude,
    latitude,
    regionCode: "440400",
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
    coverPhotoUrl: null,
    rating: null,
  };
}

const locations = {
  "poi-a": location("poi-a", "情侣路", 113.5, 22.1),
  "poi-b": location("poi-b", "珠海渔女", 113.55, 22.12),
  "poi-null": location("poi-null", "无名景点", null, null),
};

describe("buildDayRoute", () => {
  it("numbers stops in itinerary order and maps transport modes", () => {
    const route = buildDayRoute(
      dayWith([
        stop("s1", "poi-a", "情侣路"),
        transport("t1", "poi-a", "poi-b", "walk"),
        stop("s2", "poi-b", "珠海渔女"),
      ]),
      locations,
    );

    expect(route.stops.map((entry) => entry.number)).toEqual([1, 2]);
    expect(route.stops.map((entry) => entry.poiId)).toEqual(["poi-a", "poi-b"]);
    expect(route.segments).toHaveLength(1);
    expect(route.segments[0]).toMatchObject({
      fromNumber: 1,
      toNumber: 2,
      mode: "walk",
      samePoi: false,
      drawable: true,
    });
  });

  it("treats self_drive and drive as driving routes", () => {
    const route = buildDayRoute(
      dayWith([
        stop("s1", "poi-a", "情侣路"),
        transport("t1", "poi-a", "poi-b", "self_drive"),
        stop("s2", "poi-b", "珠海渔女"),
      ]),
      locations,
    );

    expect(route.segments[0].mode).toBe("drive");
  });

  it("skips routing for adjacent stops with the same poiId", () => {
    const route = buildDayRoute(
      dayWith([
        stop("s1", "poi-a", "情侣路"),
        transport("t1", "poi-a", "poi-a", "drive"),
        stop("s2", "poi-a", "情侣路"),
      ]),
      locations,
    );

    expect(route.segments[0]).toMatchObject({
      samePoi: true,
      drawable: false,
      missingNames: [],
    });
  });

  it("marks segments with missing coordinates as not drawable", () => {
    const route = buildDayRoute(
      dayWith([
        stop("s1", "poi-a", "情侣路"),
        transport("t1", "poi-a", "poi-null", "drive"),
        stop("s2", "poi-null", "无名景点"),
      ]),
      locations,
    );

    expect(route.segments[0].drawable).toBe(false);
    expect(route.segments[0].missingNames).toEqual(["无名景点"]);
    expect(route.missingNames).toEqual(["无名景点"]);
  });

  it("returns no segments when the day has fewer than two stops", () => {
    expect(buildDayRoute(dayWith([]), locations)).toMatchObject({
      stops: [],
      segments: [],
    });
    expect(
      buildDayRoute(dayWith([stop("s1", "poi-a", "情侣路")]), locations),
    ).toMatchObject({ stops: [{ number: 1 }], segments: [] });
  });
});

describe("route label formatting", () => {
  it("formats distances in meters below 1km and kilometers above", () => {
    expect(formatRouteDistance(850)).toBe("850 米");
    expect(formatRouteDistance(1234)).toBe("1.2 公里");
    expect(formatRouteDistance(1000)).toBe("1.0 公里");
  });

  it("rounds route seconds up to whole minutes", () => {
    expect(routeMinutesFromSeconds(61)).toBe(2);
    expect(routeMinutesFromSeconds(1080)).toBe(18);
    expect(formatRouteDuration(20)).toBe("20 分钟");
  });

  it("prefers the saved estimate over the route duration", () => {
    const route = buildDayRoute(
      dayWith([
        stop("s1", "poi-a", "情侣路"),
        transport("t1", "poi-a", "poi-b", "drive", 20),
        stop("s2", "poi-b", "珠海渔女"),
      ]),
      locations,
    );
    const segment = route.segments[0];

    expect(
      formatRouteLabel(1200, segment.estimateMinutes ?? routeMinutesFromSeconds(1080)),
    ).toBe("1.2 公里 · 20 分钟");
  });

  it("falls back to the route duration when there is no estimate", () => {
    const route = buildDayRoute(
      dayWith([
        stop("s1", "poi-a", "情侣路"),
        transport("t1", "poi-a", "poi-b", "walk"),
        stop("s2", "poi-b", "珠海渔女"),
      ]),
      locations,
    );
    const segment = route.segments[0];

    expect(
      formatRouteLabel(850, segment.estimateMinutes ?? routeMinutesFromSeconds(61)),
    ).toBe("850 米 · 2 分钟");
  });
});
