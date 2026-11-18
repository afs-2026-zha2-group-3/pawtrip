package com.pawtrip.server.policy;

import java.util.List;

final class CityPetPolicyResponses {

	private CityPetPolicyResponses() {
	}

	record PetPolicy(String adcode, String name, boolean covered, String areaScope, List<String> policies,
			List<String> bannedBreeds, List<String> allowedBreeds, String allowedPetTypes, Source source,
			String updatedMonth, Match match) {
	}

	record Source(String title, String note) {
	}

	record Match(Long breedId, String breedName, boolean matched, boolean allowed) {
	}

}
