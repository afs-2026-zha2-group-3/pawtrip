package com.pawtrip.server.policy;

import java.util.List;

final class BreedMatcher {

	static final String OTHER_BREED = "其他";

	private BreedMatcher() {
	}

	static Match match(String breed, List<String> bannedBreeds) {
		String normalized = breed == null ? null : breed.trim();
		if (normalized == null || normalized.isEmpty() || OTHER_BREED.equals(normalized)) {
			return null;
		}
		if (bannedBreeds == null || bannedBreeds.isEmpty()) {
			return null;
		}
		return new Match(normalized, bannedBreeds.contains(normalized));
	}

	record Match(String breed, boolean matched) {
	}

}
