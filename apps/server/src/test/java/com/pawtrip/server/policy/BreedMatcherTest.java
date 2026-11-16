package com.pawtrip.server.policy;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class BreedMatcherTest {

	@Test
	void returnsNullWhenBreedIsMissingBlankOrOther() {
		assertThat(BreedMatcher.match(null, List.of("比特斗牛梗犬"))).isNull();
		assertThat(BreedMatcher.match("", List.of("比特斗牛梗犬"))).isNull();
		assertThat(BreedMatcher.match("  ", List.of("比特斗牛梗犬"))).isNull();
		assertThat(BreedMatcher.match("其他", List.of("比特斗牛梗犬"))).isNull();
	}

	@Test
	void returnsNullWhenBannedListIsEmptyOrMissing() {
		assertThat(BreedMatcher.match("比特斗牛梗犬", List.of())).isNull();
		assertThat(BreedMatcher.match("比特斗牛梗犬", null)).isNull();
	}

	@Test
	void matchesOnlyExactBreedNames() {
		assertThat(BreedMatcher.match("比特斗牛梗犬", List.of("比特斗牛梗犬", "罗威纳犬")))
			.isEqualTo(new BreedMatcher.Match("比特斗牛梗犬", true));
		assertThat(BreedMatcher.match("柯基", List.of("比特斗牛梗犬")))
			.isEqualTo(new BreedMatcher.Match("柯基", false));
		assertThat(BreedMatcher.match("比特", List.of("比特斗牛梗犬")))
			.isEqualTo(new BreedMatcher.Match("比特", false));
	}

	@Test
	void trimsBreedBeforeComparison() {
		assertThat(BreedMatcher.match(" 比特斗牛梗犬 ", List.of("比特斗牛梗犬")))
			.isEqualTo(new BreedMatcher.Match("比特斗牛梗犬", true));
	}

}
