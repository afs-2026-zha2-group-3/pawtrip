import { describe, expect, it } from "vitest";
import {
  ESTIMATE_LOADING_TEXT,
  ESTIMATE_UNAVAILABLE_TEXT,
  SAME_POI_NOTE,
  TAXI_PET_HINT,
  TRANSIT_PET_NOTICE,
  buildDaySegments,
  showTransitNotice,
  toNextLabels,
  transportSelectorOptions,
} from "./transport-segments";
import type { TripStop } from "./types";

const A: TripStop = { poiId: "poi-a" };
const B: TripStop = { poiId: "poi-b" };
const C: TripStop = { poiId: "poi-c" };

describe("buildDaySegments", () => {
  it("generates n-1 segments for n stops and none after the last stop", () => {
    const segments = buildDaySegments([A, B, C], null);
    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ fromIndex: 0, fromPoiId: "poi-a", toPoiId: "poi-b" });
    expect(segments[1]).toMatchObject({ fromIndex: 1, fromPoiId: "poi-b", toPoiId: "poi-c" });
  });

  it("generates no segments for zero or one stop", () => {
    expect(buildDaySegments([], null)).toEqual([]);
    expect(buildDaySegments([A], null)).toEqual([]);
    expect(buildDaySegments([A], "drive")).toEqual([]);
  });

  it("flags adjacent same-poi segments and suppresses the taxi hint", () => {
    const segments = buildDaySegments([A, { poiId: "poi-a" }, B], null);
    expect(segments[0].samePoi).toBe(true);
    expect(segments[0].showTaxiHint).toBe(false);
    expect(segments[1].samePoi).toBe(false);
  });

  it("derives the display mode without rewriting the stop", () => {
    const stops: TripStop[] = [A, B, C];
    expect(buildDaySegments(stops, null)[0].displayMode).toBe("drive");
    expect(buildDaySegments(stops, "flight")[0].displayMode).toBe("drive");
    expect(buildDaySegments(stops, "drive")[0].displayMode).toBe("self_drive");
    expect(stops[0].toNext ?? null).toBeNull();
    expect(stops[0].toNextEstimate ?? null).toBeNull();
  });

  it("keeps explicit saved modes and treats legacy transit as the default", () => {
    const walk: TripStop = { poiId: "poi-a", toNext: "walk" };
    const taxi: TripStop = { poiId: "poi-a", toNext: "drive" };
    const selfDrive: TripStop = { poiId: "poi-a", toNext: "self_drive" };
    const transit: TripStop = { poiId: "poi-a", toNext: "transit" };
    expect(buildDaySegments([walk, B], "drive")[0].displayMode).toBe("walk");
    expect(buildDaySegments([taxi, B], "drive")[0].displayMode).toBe("drive");
    expect(buildDaySegments([selfDrive, B], null)[0].displayMode).toBe("self_drive");
    expect(buildDaySegments([transit, B], null)[0].displayMode).toBe("drive");
    expect(buildDaySegments([transit, B], "drive")[0].displayMode).toBe("self_drive");
  });

  it("shows the taxi pet hint only for taxi display mode", () => {
    expect(buildDaySegments([A, B], null)[0].showTaxiHint).toBe(true);
    expect(buildDaySegments([{ poiId: "poi-a", toNext: "drive" }, B], "drive")[0].showTaxiHint).toBe(true);
    expect(buildDaySegments([A, B], "drive")[0].showTaxiHint).toBe(false);
    expect(buildDaySegments([{ poiId: "poi-a", toNext: "walk" }, B], null)[0].showTaxiHint).toBe(false);
    expect(buildDaySegments([{ poiId: "poi-a", toNext: "self_drive" }, B], null)[0].showTaxiHint).toBe(false);
  });
});

describe("showTransitNotice", () => {
  it("shows one notice per day with segments when the main transport is not drive", () => {
    expect(showTransitNotice([A, B], null)).toBe(true);
    expect(showTransitNotice([A, B], "flight")).toBe(true);
    expect(showTransitNotice([A, B], "high_speed_rail")).toBe(true);
  });

  it("hides the notice in self-drive mode and for days without segments", () => {
    expect(showTransitNotice([A, B], "drive")).toBe(false);
    expect(showTransitNotice([A], null)).toBe(false);
    expect(showTransitNotice([], null)).toBe(false);
    expect(showTransitNotice([A], "drive")).toBe(false);
  });
});

describe("transportSelectorOptions", () => {
  it("offers taxi and walking only for public transport or unset mode", () => {
    expect(transportSelectorOptions(null)).toEqual(["drive", "walk"]);
    expect(transportSelectorOptions("flight")).toEqual(["drive", "walk"]);
    expect(transportSelectorOptions("high_speed_rail")).toEqual(["drive", "walk"]);
  });

  it("adds explicitly selectable driving in self-drive mode", () => {
    expect(transportSelectorOptions("drive")).toEqual(["drive", "walk", "self_drive"]);
  });
});

describe("fixed copy", () => {
  it("locks the static hint and notice texts", () => {
    expect(TAXI_PET_HINT).toBe("部分平台提供宠物专车选项；普通网约车需司机同意，建议航空箱携带");
    expect(TRANSIT_PET_NOTICE).toBe("地铁/公交：不可携带宠物上车");
    expect(SAME_POI_NOTE).toBe("与上一景点相同，无需途内交通");
    expect(ESTIMATE_UNAVAILABLE_TEXT).toBe("估算暂不可用");
    expect(ESTIMATE_LOADING_TEXT).toBe("估算中…");
    expect(toNextLabels).toEqual({ drive: "打车", walk: "步行", self_drive: "驾车" });
  });
});