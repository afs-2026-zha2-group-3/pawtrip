package com.pawtrip.server.location;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
class LocationQueryService {

	private static final int DEFAULT_PAGE = 1;
	private static final int DEFAULT_PAGE_SIZE = 20;
	private static final int MAX_PAGE_SIZE = 100;

	private final PawtripLocationRepository locationRepository;
	private final AdministrativeRegionRepository regionRepository;

	LocationQueryService(PawtripLocationRepository locationRepository,
			AdministrativeRegionRepository regionRepository) {
		this.locationRepository = locationRepository;
		this.regionRepository = regionRepository;
	}

	LocationQueryResponses.Page<LocationQueryResponses.AttractionSummary> attractions(String regionCode,
			boolean includeWithoutRules, Integer requestedPage, Integer requestedPageSize) {
		ValidatedRegion region = validateRegion(regionCode);
		PageParameters page = validatePage(requestedPage, requestedPageSize);
		Page<PawtripLocation> result = this.locationRepository.findAttractionPage(
				region.code(), region.level(), includeWithoutRules ? 1 : 0,
				PageRequest.of(page.page() - 1, page.pageSize()));
		return new LocationQueryResponses.Page<>(
				page.page(),
				page.pageSize(),
				result.getTotalElements(),
				result.getTotalPages(),
				result.hasNext(),
				result.hasPrevious(),
				result.getContent().stream().map(LocationQueryResponses.AttractionSummary::from).toList());
	}

	LocationQueryResponses.LocationDetail detail(String poiId) {
		return this.locationRepository.findByPoiId(poiId)
				.map(LocationQueryResponses.LocationDetail::from)
				.orElseThrow(() -> new ApiException(ApiErrorCode.LOCATION_NOT_FOUND, "Saved location was not found"));
	}

	private ValidatedRegion validateRegion(String regionCode) {
		if (regionCode == null || !regionCode.matches("\\d{6}")) {
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
