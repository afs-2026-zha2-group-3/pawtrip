package com.pawtrip.server.location;

public final class AdminLocationRequests {

	private AdminLocationRequests() {
	}

	public record SaveLocation(String poiId, String typeGroup, Integer minVisitHours, Integer maxVisitHours) {
	}

	public record UpdateVisitHours(Integer minVisitHours, Integer maxVisitHours) {
	}
}
