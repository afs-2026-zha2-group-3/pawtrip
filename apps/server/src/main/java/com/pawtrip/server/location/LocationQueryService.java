package com.pawtrip.server.location;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
class LocationQueryService {

	private static final int DEFAULT_PAGE = 1;
	private static final int DEFAULT_PAGE_SIZE = 20;
	private static final int MAX_PAGE_SIZE = 100;

	private final PawtripLocationRepository locationRepository;
	private final AdministrativeRegionRepository regionRepository;
	private final LocationPhotoRepository photoRepository;
	private final ObjectMapper objectMapper;

	LocationQueryService(PawtripLocationRepository locationRepository,
			AdministrativeRegionRepository regionRepository, LocationPhotoRepository photoRepository,
			ObjectMapper objectMapper) {
		this.locationRepository = locationRepository;
		this.regionRepository = regionRepository;
		this.photoRepository = photoRepository;
		this.objectMapper = objectMapper;
	}

	LocationQueryResponses.Page<LocationQueryResponses.LocationSummary> locations(String regionCode, String typeGroup,
			boolean petFriendlyOnly, Integer requestedPage, Integer requestedPageSize, boolean allowUnrestrictedRegion) {
		if (regionCode == null && !allowUnrestrictedRegion) {
			throw invalidQuery();
		}
		ValidatedRegion region = validateOptionalRegion(regionCode);
		if (typeGroup != null && (typeGroup.isBlank() || LocationTypeCatalog.typeCodesForGroup(typeGroup) == null)) {
			throw invalidQuery();
		}
		PageParameters page = validatePage(requestedPage, requestedPageSize);
		Page<PawtripLocation> result = this.locationRepository.findLocationPage(
				region == null ? null : region.code(),
				region == null ? null : region.level(),
				typeGroup,
				petFriendlyOnly ? 1 : 0,
				PageRequest.of(page.page() - 1, page.pageSize()));
		Map<Long, String> covers = coverPhotos(result.getContent());
		return new LocationQueryResponses.Page<>(
				page.page(),
				page.pageSize(),
				result.getTotalElements(),
				result.getTotalPages(),
				result.hasNext(),
				result.hasPrevious(),
				result.getContent().stream()
					.map(location -> LocationQueryResponses.LocationSummary.from(location,
							covers.get(location.getId()), rating(location)))
					.toList());
	}


	LocationQueryResponses.LocationDetail detail(String poiId) {
		return this.locationRepository.findByPoiId(poiId)
			.map(location -> LocationQueryResponses.LocationDetail.from(location,
					coverPhotos(List.of(location)).get(location.getId()), rating(location)))
			.orElseThrow(() -> new ApiException(ApiErrorCode.LOCATION_NOT_FOUND, "Saved location was not found"));
	}

	private Map<Long, String> coverPhotos(List<PawtripLocation> locations) {
		if (locations.isEmpty()) {
			return Map.of();
		}
		List<Long> ids = locations.stream().map(PawtripLocation::getId).toList();
		Map<Long, String> covers = new HashMap<>();
		for (LocationPhoto photo : this.photoRepository
			.findAllByLocationIdInOrderByLocationIdAscPhotoOrderAsc(ids)) {
			covers.putIfAbsent(photo.getLocationId(), photo.getSourceUrl());
		}
		return covers;
	}

	private String rating(PawtripLocation location) {
		try {
			JsonNode rating = this.objectMapper.readTree(location.getBusinessJson()).path("rating");
			if (rating.isMissingNode() || rating.isNull()) {
				return null;
			}
			String value = rating.asString().trim();
			return value.isEmpty() ? null : value;
		}
		catch (JacksonException exception) {
			return null;
		}
	}

	private ValidatedRegion validateOptionalRegion(String regionCode) {
		if (regionCode == null) {
			return null;
		}
		if (!regionCode.matches("\\d{6}")) {
			throw invalidQuery();
		}
		AdministrativeRegion region = this.regionRepository.findById(regionCode)
				.orElseThrow(LocationQueryService::invalidQuery);
		if (!"province".equals(region.getLevel()) && !"city".equals(region.getLevel())) {
			throw invalidQuery();
		}
		return new ValidatedRegion(region.getAdcode(), region.getLevel());
	}

	private static PageParameters validatePage(Integer requestedPage, Integer requestedPageSize) {
		int page = requestedPage == null ? DEFAULT_PAGE : requestedPage;
		int pageSize = requestedPageSize == null ? DEFAULT_PAGE_SIZE : requestedPageSize;
		if (page < 1 || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
			throw invalidQuery();
		}
		return new PageParameters(page, pageSize);
	}

	private static ApiException invalidQuery() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid location query");
	}

	private record ValidatedRegion(String code, String level) {
	}

	private record PageParameters(int page, int pageSize) {
	}

}
