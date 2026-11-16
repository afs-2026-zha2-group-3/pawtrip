package com.pawtrip.server.trip;

import tools.jackson.databind.JsonNode;

public final class TripRequests {

	private TripRequests() {
	}

	public record SaveTrip(String name, String cityAdcode, Long petId, Integer totalDays, JsonNode plan) {
	}

}
