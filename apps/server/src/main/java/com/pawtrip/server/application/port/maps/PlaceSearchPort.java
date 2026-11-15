package com.pawtrip.server.application.port.maps;

import com.pawtrip.server.application.model.maps.KeywordPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.NearbyPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.PlaceSearchResult;
import com.pawtrip.server.application.model.maps.PlaceTypeSearchRequest;
import tools.jackson.databind.JsonNode;

public interface PlaceSearchPort {

	PlaceSearchResult searchByKeyword(KeywordPlaceSearchRequest request);

	PlaceSearchResult searchByTypes(PlaceTypeSearchRequest request);

	JsonNode getPlaceById(String poiId);

	PlaceSearchResult searchNearby(NearbyPlaceSearchRequest request);
}
