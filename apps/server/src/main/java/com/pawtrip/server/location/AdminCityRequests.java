package com.pawtrip.server.location;

import java.util.List;

public final class AdminCityRequests {

	private AdminCityRequests() {
	}

	public record UpdateCity(AdminLocationRequests.PetPolicies petPolicies, List<Long> allowedDogBreedIds) {
	}
}
