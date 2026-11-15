package com.pawtrip.server.application.model.maps;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.node.ObjectNode;

class PlaceSearchResultTest {

	private final JsonMapper jsonMapper = JsonMapper.builder().build();

	@Test
	void preservesArbitraryPoiJsonAndDefensivelyCopiesIt() throws Exception {
		JsonNode poi = jsonMapper.readTree(
				"""
				{"name":"Paw Cafe","rank":2,"open":true,"metadata":{"tags":["pet","coffee"],"rating":4.8}}
				""");
		PlaceSearchResult result = new PlaceSearchResult(37, 2, 10, List.of(poi));

		((ObjectNode) poi).put("name", "mutated source");
		List<JsonNode> returnedPois = result.pois();
		((ObjectNode) returnedPois.getFirst()).put("name", "mutated result");

		assertThat(result.totalCount()).isEqualTo(37);
		assertThat(result.pageNum()).isEqualTo(2);
		assertThat(result.pageSize()).isEqualTo(10);
		assertThat(result.pois().getFirst().toString())
				.isEqualTo(
						"{\"name\":\"Paw Cafe\",\"rank\":2,\"open\":true,\"metadata\":{\"tags\":[\"pet\",\"coffee\"],\"rating\":4.8}}");
	}
}
