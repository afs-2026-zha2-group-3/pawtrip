package com.pawtrip.server.policy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class BreedMatcherTest {

	@Test
	void returnsFalseWhenBreedIdIsMissing() {
		assertThat(BreedMatcher.matches(null, List.of(18L))).isFalse();
	}

	@Test
	void returnsFalseWhenBannedListIsEmptyOrMissing() {
		assertThat(BreedMatcher.matches(18L, List.of())).isFalse();
		assertThat(BreedMatcher.matches(18L, null)).isFalse();
	}

	@Test
	void matchesOnlyBannedBreedIds() {
		assertThat(BreedMatcher.matches(18L, List.of(18L, 4L))).isTrue();
		assertThat(BreedMatcher.matches(10L, List.of(18L, 4L))).isFalse();
	}

}
