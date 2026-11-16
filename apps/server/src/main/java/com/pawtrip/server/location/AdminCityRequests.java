package com.pawtrip.server.location;

import java.util.List;

public final class AdminCityRequests {

	private AdminCityRequests() {
	}

	public record UpdateAllowedBreeds(List<Long> breedIds) {
	}

}
