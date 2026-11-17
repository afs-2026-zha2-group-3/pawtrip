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
	void acceptsSelfDriveToNext() {
		TripPlan plan = VALIDATOR.validate(json("""
				{"version":1,"days":[{"day":1,"stops":[{"poiId":"A","toNext":"self_drive"}]}],"unscheduled":[]}
				"""), 1);

		assertThat(plan.days().get(0).stops()).extracting(TripPlan.TripStop::toNext)
			.containsExactly("self_drive");
	}

	@Test
	void parsesAndKeepsValidToNextEstimate() {
		TripPlan plan = VALIDATOR.validate(json("""
				{"version":1,"days":[{"day":1,"stops":[
					{"poiId":"A","toNext":"drive","toNextEstimate":{"durationMinutes":25,"costLowYuan":40,"costHighYuan":60}},
					{"poiId":"B","toNext":"walk","toNextEstimate":{"durationMinutes":10,"costLowYuan":0,"costHighYuan":0}},
					{"poiId":"C","toNext":"self_drive","toNextEstimate":{"durationMinutes":47,"costLowYuan":0,"costHighYuan":0}}
				]}],"unscheduled":[]}
				"""), 1);

		var stops = plan.days().get(0).stops();
		assertThat(stops.get(0).toNextEstimate())
			.isEqualTo(new TripPlan.ToNextEstimate(25, 40.0, 60.0));
		assertThat(stops.get(1).toNextEstimate())
			.isEqualTo(new TripPlan.ToNextEstimate(10, 0.0, 0.0));
		assertThat(stops.get(2).toNextEstimate())
			.isEqualTo(new TripPlan.ToNextEstimate(47, 0.0, 0.0));
	}

	@Test
	void treatsMissingOrNullEstimateAsNullAndKeepsDecimalCosts() {
		TripPlan plan = VALIDATOR.validate(json("""
				{"version":1,"days":[{"day":1,"stops":[
					{"poiId":"A","toNext":"drive"},
					{"poiId":"B","toNext":null,"toNextEstimate":null},
					{"poiId":"C","toNext":"drive","toNextEstimate":{"durationMinutes":0,"costLowYuan":101.6,"costHighYuan":152.4}}
				]}],"unscheduled":[]}
				"""), 1);

		var stops = plan.days().get(0).stops();
		assertThat(stops.get(0).toNextEstimate()).isNull();
		assertThat(stops.get(1).toNextEstimate()).isNull();
		assertThat(stops.get(2).toNextEstimate())
			.isEqualTo(new TripPlan.ToNextEstimate(0, 101.6, 152.4));
	}

	@Test
	void rejectsInvalidToNextEstimates() {
		assertInvalidEstimate("{\"costLowYuan\":40,\"costHighYuan\":60}");
		assertInvalidEstimate("{\"durationMinutes\":25,\"costHighYuan\":60}");
		assertInvalidEstimate("{\"durationMinutes\":25,\"costLowYuan\":40}");
		assertInvalidEstimate("{\"durationMinutes\":\"25\",\"costLowYuan\":40,\"costHighYuan\":60}");
		assertInvalidEstimate("{\"durationMinutes\":25,\"costLowYuan\":\"40\",\"costHighYuan\":60}");
		assertInvalidEstimate("{\"durationMinutes\":25,\"costLowYuan\":40,\"costHighYuan\":true}");
		assertInvalidEstimate("{\"durationMinutes\":-1,\"costLowYuan\":40,\"costHighYuan\":60}");
		assertInvalidEstimate("{\"durationMinutes\":25,\"costLowYuan\":-0.1,\"costHighYuan\":60}");
		assertInvalidEstimate("{\"durationMinutes\":25,\"costLowYuan\":40,\"costHighYuan\":-60}");
		assertInvalidEstimate("{\"durationMinutes\":1.5,\"costLowYuan\":40,\"costHighYuan\":60}");
		assertInvalidEstimate("{\"durationMinutes\":25,\"costLowYuan\":61,\"costHighYuan\":60}");
		assertInvalidEstimate("[]");
		assertInvalidEstimate("\"25\"");
		assertInvalidEstimate("25");
	}

	@Test
	void roundtripsSnapshotThroughSerialization() {
		TripPlan plan = VALIDATOR.validate(json("""
				{"version":1,"days":[{"day":1,"stops":[
					{"poiId":"A","toNext":"drive","toNextEstimate":{"durationMinutes":25,"costLowYuan":40,"costHighYuan":60}},
					{"poiId":"B","toNext":"self_drive","toNextEstimate":{"durationMinutes":47,"costLowYuan":0,"costHighYuan":0}},
					{"poiId":"C"}
				]}],"unscheduled":[]}
				"""), 1);

		TripPlan roundtripped = VALIDATOR.validate(VALIDATOR.read(VALIDATOR.serialize(plan)), 1);

		assertThat(roundtripped).isEqualTo(plan);
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

	private static void assertInvalidEstimate(String estimateJson) {
		assertInvalid(json("""
				{"version":1,"days":[{"day":1,"stops":[{"poiId":"A","toNext":"drive","toNextEstimate":%s}]}],"unscheduled":[]}
				""".formatted(estimateJson)), 1);
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
