package com.pawtrip.server.trip;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Component
class TripPlanValidator {

	private static final int VERSION = 1;

	private static final Set<String> TRANSPORT_MODES = Set.of("walk", "drive", "transit");

	private final ObjectMapper objectMapper;

	TripPlanValidator(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	TripPlan validate(JsonNode plan, Integer totalDays) {
		if (totalDays == null || totalDays < 1) {
			throw invalid();
		}
		if (plan == null || plan.isNull()) {
			return TripPlan.EMPTY;
		}
		if (!plan.isObject()) {
			throw invalid();
		}
		JsonNode version = plan.get("version");
		if (version == null || !version.isInt() || version.asInt() != VERSION) {
			throw invalid();
		}

		List<TripPlan.TripDay> days = parseDays(plan.get("days"), totalDays);
		List<TripPlan.TripStopRef> unscheduled = parseUnscheduled(plan.get("unscheduled"));
		Set<String> scheduled = new HashSet<>();
		for (TripPlan.TripDay day : days) {
			for (TripPlan.TripStop stop : day.stops()) {
				scheduled.add(stop.poiId());
			}
		}
		List<TripPlan.TripStopRef> filtered = unscheduled.stream()
				.filter(stop -> !scheduled.contains(stop.poiId()))
				.toList();
		return new TripPlan(VERSION, days, filtered);
	}

	String serialize(TripPlan plan) {
		return this.objectMapper.writeValueAsString(plan);
	}

	JsonNode read(String json) {
		return this.objectMapper.readTree(json);
	}

	private static List<TripPlan.TripDay> parseDays(JsonNode node, int totalDays) {
		if (node == null || node.isNull()) {
			return List.of();
		}
		if (!node.isArray()) {
			throw invalid();
		}
		List<TripPlan.TripDay> days = new ArrayList<>();
		Set<Integer> seenDays = new HashSet<>();
		for (JsonNode dayNode : node) {
			if (dayNode == null || !dayNode.isObject()) {
				throw invalid();
			}
			JsonNode dayValue = dayNode.get("day");
			if (dayValue == null || !dayValue.isInt()) {
				throw invalid();
			}
			int day = dayValue.asInt();
			if (day < 1 || day > totalDays || !seenDays.add(day)) {
				throw invalid();
			}
			days.add(new TripPlan.TripDay(day, parseStops(dayNode.get("stops"))));
		}
		return days;
	}

	private static List<TripPlan.TripStop> parseStops(JsonNode node) {
		if (node == null || node.isNull()) {
			return List.of();
		}
		if (!node.isArray()) {
			throw invalid();
		}
		List<TripPlan.TripStop> stops = new ArrayList<>();
		for (JsonNode stopNode : node) {
			if (stopNode == null || !stopNode.isObject()) {
				throw invalid();
			}
			String poiId = poiId(stopNode.get("poiId"));
			JsonNode toNextNode = stopNode.get("toNext");
			String toNext = null;
			if (toNextNode != null && !toNextNode.isNull()) {
				if (!toNextNode.isString() || !TRANSPORT_MODES.contains(toNextNode.asString())) {
					throw invalid();
				}
				toNext = toNextNode.asString();
			}
			stops.add(new TripPlan.TripStop(poiId, toNext));
		}
		return stops;
	}

	private static List<TripPlan.TripStopRef> parseUnscheduled(JsonNode node) {
		if (node == null || node.isNull()) {
			return List.of();
		}
		if (!node.isArray()) {
			throw invalid();
		}
		Set<String> poiIds = new LinkedHashSet<>();
		for (JsonNode refNode : node) {
			if (refNode == null || !refNode.isObject()) {
				throw invalid();
			}
			poiIds.add(poiId(refNode.get("poiId")));
		}
		return poiIds.stream().map(TripPlan.TripStopRef::new).toList();
	}

	private static String poiId(JsonNode node) {
		if (node == null || !node.isString()) {
			throw invalid();
		}
		String poiId = node.asString().trim();
		if (poiId.isEmpty()) {
			throw invalid();
		}
		return poiId;
	}

	private static ApiException invalid() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid trip plan");
	}

}
