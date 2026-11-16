package com.pawtrip.server.policy;

import java.util.List;

final class BreedMatcher {

	private BreedMatcher() {
	}

	static boolean matches(Long breedId, List<Long> bannedBreedIds) {
		return breedId != null && bannedBreedIds != null && bannedBreedIds.contains(breedId);
	}

}
