package com.pawtrip.server.application.model.maps;

import java.util.List;

public record PlaceTypeSearchRequest(List<String> typeCodes, String regionCode, Integer pageNum, Integer pageSize) {

	public PlaceTypeSearchRequest {
		if (typeCodes != null) {
			typeCodes = List.copyOf(typeCodes);
		}
	}

}
