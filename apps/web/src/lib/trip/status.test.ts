import { describe, expect, it } from "vitest";
import {
  isEditingTrip,
  isTripEnded,
  tripEndDate,
  tripStatus,
  tripStatusOrder,
  todayIsoDate,
} from "./status";

const base = {
  startDate: "2026-11-10",
  totalDays: 3,
  planCompleted: false,
};

describe("trip status", () => {
  it("derives the last day from the start date and total days", () => {
    expect(tripEndDate(base)).toBe("2026-11-12");
    expect(tripEndDate({ startDate: null, totalDays: 3 })).toBeNull();
  });

  it("keeps the trip editable on its last day", () => {
    expect(isTripEnded(base, "2026-11-12")).toBe(false);
    expect(isTripEnded(base, "2026-11-13")).toBe(true);
  });

  it("never ends a trip without a start date", () => {
    expect(isTripEnded({ startDate: null, totalDays: 3 }, "2099-01-01")).toBe(
      false,
    );
  });

  it("distinguishes pending, completed and ended", () => {
    expect(tripStatus(base, "2026-11-11")).toBe("pending");
    expect(
      tripStatus({ ...base, planCompleted: true }, "2026-11-11"),
    ).toBe("completed");
    expect(
      tripStatus({ ...base, planCompleted: true }, "2026-11-13"),
    ).toBe("ended");
    expect(tripStatus(base, "2026-11-13")).toBe("ended");
  });

  it("orders pending before completed before ended", () => {
    expect(tripStatusOrder("pending")).toBeLessThan(
      tripStatusOrder("completed"),
    );
    expect(tripStatusOrder("completed")).toBeLessThan(
      tripStatusOrder("ended"),
    );
  });

  it("marks the active trip as editing until it ends", () => {
    expect(isEditingTrip({ id: 7, ...base }, 7, "2026-11-11")).toBe(true);
    expect(isEditingTrip({ id: 7, ...base }, 8, "2026-11-11")).toBe(false);
    expect(isEditingTrip({ id: 7, ...base }, 7, "2026-11-13")).toBe(false);
  });

  it("formats today as a date-only string", () => {
    expect(todayIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});