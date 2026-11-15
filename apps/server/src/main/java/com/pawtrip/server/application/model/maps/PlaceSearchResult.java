package com.pawtrip.server.application.model.maps;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import tools.jackson.databind.JsonNode;

public record PlaceSearchResult(long totalCount, int pageNum, int pageSize, List<JsonNode> pois) {

	public PlaceSearchResult {
		if (totalCount < 0 || pageNum < 1 || pageSize < 1) {
			throw new IllegalArgumentException("Invalid place search result metadata");
		}
		pois = copyPois(pois);
	}

	@Override
	public List<JsonNode> pois() {
		return copyPois(pois);
	}

	private static List<JsonNode> copyPois(List<JsonNode> pois) {
		Objects.requireNonNull(pois, "pois");
		List<JsonNode> copies = new ArrayList<>(pois.size());
		for (JsonNode poi : pois) {
			copies.add(Objects.requireNonNull(poi, "poi").deepCopy());
		}
		return List.copyOf(copies);
	}
}
