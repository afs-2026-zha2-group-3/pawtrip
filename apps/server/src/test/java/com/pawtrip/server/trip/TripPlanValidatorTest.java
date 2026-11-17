package com.pawtrip.server.trip;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class TripPlanValidatorTest {

	private static final JsonMapper JSON = JsonMapper.builder().build();

	private static final TripPlanValidator VALIDATOR = new TripPlanValidator(JSON);

	@Test
	void treatsMissingOrNullPlanAsEmpty() {
		assertThat(VALIDATOR.validate(null, 1)).isEqualTo(TripPlan.EMPTY);
		assertThat(VALIDATOR.validate(json("null"), 1)).isEqualTo(TripPlan.EMPTY);
	}

	@Test
	void treatsMissingArraysAsEmpty() {
		TripPlan plan = VALIDATOR.validate(json("{\"version\":1}"), 1);

		assertThat(plan.version()).isEqualTo(1);
		assertThat(plan.days()).isEmpty();
		assertThat(plan.unscheduled()).isEmpty();
	}

	@Test
	void keepsDuplicateScheduledPoiIds() {
		TripPlan plan = VALIDATOR.validate(json("""
				{"version":1,"days":[
					{"day":1,"stops":[{"poiId":"A"}]},
					{"day":2,"stops":[{"poiId":"A"}]}
				],"unscheduled":[]}
				"""), 2);

		assertThat(plan.days()).hasSize(2);
		assertThat(plan.days().get(0).stops()).extracting(TripPlan.TripStop::poiId).containsExactly("A");
		assertThat(plan.days().get(1).stops()).extracting(TripPlan.TripStop::poiId).containsExactly("A");
	}

	@Test
	void deduplicatesUnscheduledAndRemovesScheduledPoiIds() {
		TripPlan plan = VALIDATOR.validate(json("""
				{"version":1,"days":[
					{"day":1,"stops":[{"poiId":"A"}]}
				],"unscheduled":[
					{"poiId":"B"},{"poiId":"B"},{"poiId":"A"},{"poiId":"C"}
				]}
				"""), 1);

		assertThat(plan.unscheduled()).extracting(TripPlan.TripStopRef::poiId).containsExactly("B", "C");
	}

	@Test
	void acceptsOptionalAndValidToNextValues() {
		TripPlan plan = VALIDATOR.validate(json("""
				{"version":1,"days":[
					{"day":1,"stops":[
						{"poiId":"A"},
						{"poiId":"B","toNext":null},
						{"poiId":"C","toNext":"walk"},
						{"poiId":"D","toNext":"drive"},
						{"poiId":"E","toNext":"transit"}
					]}
				],"unscheduled":[]}
				"""), 1);

		assertThat(plan.days().get(0).stops()).extracting(TripPlan.TripStop::toNext)
			.containsExactly(null, null, "walk", "drive", "transit");
	}

	@Test
	void rejectsInvalidToNextValues() {
		assertInvalid(json("""
				{"version":1,"days":[{"day":1,"stops":[{"poiId":"A","toNext":"bus"}]}],"unscheduled":[]}
				"""), 1);
		assertInvalid(json("""
				{"version":1,"days":[{"day":1,"stops":[{"poiId":"A","toNext":"WALK"}]}],"unscheduled":[]}
				"""), 1);
		assertInvalid(json("""
				{"version":1,"days":[{"day":1,"stops":[{"poiId":"A","toNext":1}]}],"unscheduled":[]}
				"""), 1);
	}

	@Test
	void rejectsDuplicateOrOutOfRangeDays() {
		assertInvalid(json("""
				{"version":1,"days":[{"day":0,"stops":[]}],"unscheduled":[]}
				"""), 2);
		assertInvalid(json("""
				{"version":1,"days":[{"day":2,"stops":[]}],"unscheduled":[]}
				"""), 1);
		assertInvalid(json("""
				{"version":1,"days":[
					{"day":1,"stops":[]},
					{"day":1,"stops":[]}
				],"unscheduled":[]}
				"""), 1);
		assertInvalid(json("""
				{"version":1,"days":[{"day":"1","stops":[]}],"unscheduled":[]}
				"""), 1);
	}

	@Test
	void rejectsMissingOrInvalidVersion() {
		assertInvalid(json("{\"days\":[],\"unscheduled\":[]}"), 1);
		assertInvalid(json("{\"version\":2,\"days\":[],\"unscheduled\":[]}"), 1);
		assertInvalid(json("{\"version\":\"1\",\"days\":[],\"unscheduled\":[]}"), 1);
	}

	@Test
	void rejectsNonPositiveTotalDays() {
		assertInvalid(null, null);
		assertInvalid(null, 0);
		assertInvalid(null, -1);
	}

	@Test
	void rejectsTotalDaysBelowMaximumDay() {
		assertInvalid(json("""
				{"version":1,"days":[{"day":2,"stops":[]}],"unscheduled":[]}
				"""), 1);
	}

	@Test
	void serializesCanonicalEmptyPlan() {
		assertThat(VALIDATOR.serialize(TripPlan.EMPTY))
			.isEqualTo("{\"version\":1,\"days\":[],\"unscheduled\":[]}");
	}

	private static JsonNode json(String value) {
		return JSON.readTree(value);
	}

	private static void assertInvalid(JsonNode plan, Integer totalDays) {
		assertThatThrownBy(() -> VALIDATOR.validate(plan, totalDays))
			.isInstanceOf(ApiException.class)
			.satisfies(exception -> assertThat(((ApiException) exception).getCode())
				.isEqualTo(ApiErrorCode.VALIDATION_ERROR));
	}

}
