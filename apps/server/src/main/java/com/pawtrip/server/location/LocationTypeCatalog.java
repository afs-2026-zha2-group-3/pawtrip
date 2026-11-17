package com.pawtrip.server.location;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

final class LocationTypeCatalog {

	static final String ATTRACTION_KEY = "attraction";
	static final String PET_HOSPITAL_KEY = "pet-hospital";
	static final String PET_SUPPLIES_KEY = "pet-supplies";

	private static final List<LocationQueryResponses.LocationTypeOption> OPTIONS = List.of(
			new LocationQueryResponses.LocationTypeOption(ATTRACTION_KEY, "景点", List.of("110000")),
			new LocationQueryResponses.LocationTypeOption("hotel", "住宿", List.of("100000")),
			new LocationQueryResponses.LocationTypeOption(PET_HOSPITAL_KEY, "宠物医院", List.of("090700")),
			new LocationQueryResponses.LocationTypeOption(PET_SUPPLIES_KEY, "宠物用品店", List.of("061211")),
			new LocationQueryResponses.LocationTypeOption("restaurant", "餐厅", List.of("050000")));
	private static final Map<String, List<String>> TYPE_CODES_BY_GROUP = OPTIONS.stream()
			.collect(Collectors.toUnmodifiableMap(
					LocationQueryResponses.LocationTypeOption::key,
					LocationQueryResponses.LocationTypeOption::typeCodes));

	private LocationTypeCatalog() {
	}

	static List<LocationQueryResponses.LocationTypeOption> options() {
		return OPTIONS;
	}

	static List<String> typeCodesForGroup(String typeGroup) {
		return TYPE_CODES_BY_GROUP.get(typeGroup);
	}

}
