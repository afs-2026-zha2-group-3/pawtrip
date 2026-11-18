package com.pawtrip.server.trip;

import tools.jackson.databind.JsonNode;

public final class TripResponses {

	private TripResponses() {
	}

	public record TripSummary(Long id, String name, String cityAdcode, Long petId, int totalDays, String startDate,
			boolean planCompleted, String createdAt, String updatedAt) {

		static TripSummary from(Trip trip) {
			return new TripSummary(
					trip.getId(),
					trip.getName(),
					trip.getCityAdcode(),
					trip.getPetId(),
					trip.getTotalDays(),
					trip.getStartDate(),
					trip.isPlanCompleted(),
					trip.getCreatedAt(),
					trip.getUpdatedAt());
		}

	}

	public record RouteEstimate(String mode, int durationMinutes, double costLowYuan, double costHighYuan) {
	}

	public record TripDetail(Long id, String name, String cityAdcode, Long petId, int totalDays, String startDate,
			String transportMode, boolean planCompleted, String createdAt, String updatedAt, JsonNode plan) {

		static TripDetail from(Trip trip, TripPlanValidator planValidator) {
			return new TripDetail(
					trip.getId(),
					trip.getName(),
					trip.getCityAdcode(),
					trip.getPetId(),
					trip.getTotalDays(),
					trip.getStartDate(),
					trip.getTransportMode(),
					trip.isPlanCompleted(),
					trip.getCreatedAt(),
					trip.getUpdatedAt(),
					planValidator.read(trip.getPlanJson()));
		}

	}

}
