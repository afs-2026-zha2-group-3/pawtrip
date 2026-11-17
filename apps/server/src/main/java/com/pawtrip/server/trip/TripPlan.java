package com.pawtrip.server.trip;

import java.util.List;

public record TripPlan(int version, List<TripDay> days, List<TripStopRef> unscheduled) {

	public static final TripPlan EMPTY = new TripPlan(1, List.of(), List.of());

	public TripPlan {
		days = days == null ? List.of() : List.copyOf(days);
		unscheduled = unscheduled == null ? List.of() : List.copyOf(unscheduled);
	}

	public record TripDay(int day, List<TripStop> stops) {

		public TripDay {
			stops = stops == null ? List.of() : List.copyOf(stops);
		}

	}

	public record TripStop(String poiId, String toNext, ToNextEstimate toNextEstimate) {
	}

	public record ToNextEstimate(int durationMinutes, double costLowYuan, double costHighYuan) {
	}

	public record TripStopRef(String poiId) {
	}

}
