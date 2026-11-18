import { addDays } from "./itinerary";
import type { Trip } from "./types";

export type TripStatus = "pending" | "completed" | "ended";

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  pending: "待完成",
  completed: "已完成",
  ended: "行程结束",
};

const STATUS_ORDER: Record<TripStatus, number> = {
  pending: 0,
  completed: 1,
  ended: 2,
};

type TripDates = Pick<Trip, "startDate" | "totalDays">;

export function todayIsoDate(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function tripEndDate(trip: TripDates): string | null {
  if (!trip.startDate) {
    return null;
  }
  return addDays(trip.startDate, trip.totalDays - 1);
}

export function isTripEnded(
  trip: TripDates,
  today: string = todayIsoDate(),
): boolean {
  const endDate = tripEndDate(trip);
  return endDate != null && endDate < today;
}

export function tripStatus(
  trip: Pick<Trip, "startDate" | "totalDays" | "planCompleted">,
  today: string = todayIsoDate(),
): TripStatus {
  if (isTripEnded(trip, today)) {
    return "ended";
  }
  return trip.planCompleted ? "completed" : "pending";
}

export function tripStatusOrder(status: TripStatus): number {
  return STATUS_ORDER[status];
}

export function isEditingTrip(
  trip: Pick<Trip, "id" | "startDate" | "totalDays">,
  activeTripId: number | null,
  today: string = todayIsoDate(),
): boolean {
  return activeTripId === trip.id && !isTripEnded(trip, today);
}