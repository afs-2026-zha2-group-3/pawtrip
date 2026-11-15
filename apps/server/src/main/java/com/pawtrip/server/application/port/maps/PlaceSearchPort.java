package com.pawtrip.server.application.port.maps;

import com.pawtrip.server.application.model.maps.KeywordPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.NearbyPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.PlaceSearchResult;

public interface PlaceSearchPort {

	PlaceSearchResult searchByKeyword(KeywordPlaceSearchRequest request);

	PlaceSearchResult searchNearby(NearbyPlaceSearchRequest request);
}
