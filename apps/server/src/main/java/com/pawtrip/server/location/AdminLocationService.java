package com.pawtrip.server.location;

import com.pawtrip.server.application.model.maps.PlaceSearchException;
import com.pawtrip.server.application.model.maps.PlaceSearchResult;
import com.pawtrip.server.application.model.maps.PlaceTypeSearchRequest;
import com.pawtrip.server.application.port.maps.PlaceSearchPort;
import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
class AdminLocationService {

	private static final int DEFAULT_PAGE = 1;
	private static final int DEFAULT_PAGE_SIZE = 10;
	private static final int AMAP_MAX_PAGE_SIZE = 25;
	private static final int AMAP_MAX_PAGE = 100;
	private static final int AMAP_MAX_RESULTS = 200;
	private static final int DATABASE_MAX_PAGE_SIZE = 100;
	private static final String ATTRACTION_TYPE_GROUP = "attraction";
	private static final List<String> ATTRACTION_TYPE_CODES = List.of("110000");
	private static final List<AdminLocationResponses.LocationTypeOption> LOCATION_TYPES = List.of(
			new AdminLocationResponses.LocationTypeOption(ATTRACTION_TYPE_GROUP, "景点", ATTRACTION_TYPE_CODES));
	private static final Map<String, List<String>> TYPE_CODES_BY_GROUP = Map.of(
			ATTRACTION_TYPE_GROUP, ATTRACTION_TYPE_CODES);

	private final AdministrativeRegionRepository regionRepository;
	private final PawtripLocationRepository locationRepository;
	private final LocationPhotoRepository photoRepository;
	private final LocationWriteService locationWriteService;
	private final PlaceSearchPort placeSearchPort;
	private final ObjectMapper objectMapper;

AdminLocationService(AdministrativeRegionRepository regionRepository,
		PawtripLocationRepository locationRepository, LocationPhotoRepository photoRepository,
		LocationWriteService locationWriteService, PlaceSearchPort placeSearchPort, ObjectMapper objectMapper) {
		this.regionRepository = regionRepository;
		this.locationRepository = locationRepository;
		this.photoRepository = photoRepository;
		this.locationWriteService = locationWriteService;
		this.placeSearchPort = placeSearchPort;
		this.objectMapper = objectMapper;
	}

	List<AdminLocationResponses.RegionOption> regions() {
		List<AdministrativeRegion> provinces = this.regionRepository.findAllByLevelOrderByNameAsc("province");
		List<AdministrativeRegion> cities = this.regionRepository.findAllByLevelOrderByNameAsc("city");
		Map<String, List<AdminLocationResponses.RegionOption>> citiesByProvince = cities.stream()
				.collect(Collectors.groupingBy(
						AdministrativeRegion::getParentAdcode,
						java.util.LinkedHashMap::new,
						Collectors.mapping(AdminLocationService::regionOption, Collectors.toList())));

		List<AdminLocationResponses.RegionOption> result = new ArrayList<>(provinces.size());
		for (AdministrativeRegion province : provinces) {
			List<AdminLocationResponses.RegionOption> children = citiesByProvince
					.getOrDefault(province.getAdcode(), List.of());
			result.add(new AdminLocationResponses.RegionOption(
					province.getAdcode(), province.getName(), province.getLevel(), children));
		}
		return List.copyOf(result);
	}

	List<AdminLocationResponses.LocationTypeOption> locationTypes() {
		return LOCATION_TYPES;
	}

	private static AdminLocationResponses.RegionOption regionOption(AdministrativeRegion region) {
		return new AdminLocationResponses.RegionOption(
				region.getAdcode(), region.getName(), region.getLevel(), List.of());
	}

	AdminLocationResponses.Page<AdminLocationResponses.AmapCandidate> searchAmapLocations(
			String regionCode, String typeGroup, Integer requestedPage, Integer requestedPageSize) {
		List<String> typeCodes = typeCodesForGroup(typeGroup);
		ValidatedRegion region = validateRegion(regionCode);
		PageParameters page = validatePage(requestedPage, requestedPageSize, AMAP_MAX_PAGE_SIZE, AMAP_MAX_PAGE);
		if ((long) (page.page() - 1) * page.pageSize() >= AMAP_MAX_RESULTS) {
			throw invalidQuery();
		}

		PlaceSearchResult searchResult = this.placeSearchPort.searchByTypes(new PlaceTypeSearchRequest(
				typeCodes, region == null ? null : region.code(), page.page(), page.pageSize()));
		long totalElements = Math.min(searchResult.totalCount(), AMAP_MAX_RESULTS);
		int totalPages = (int) ((totalElements + page.pageSize() - 1) / page.pageSize());
		List<JsonNode> pois = searchResult.pois();
		List<String> poiIds = pois.stream().map(poi -> requiredPoiId(poi)).toList();
		Set<String> savedPoiIds = poiIds.isEmpty()
				? Set.of()
				: this.locationRepository.findAllByPoiIdIn(poiIds).stream()
						.map(PawtripLocation::getPoiId)
						.collect(Collectors.toCollection(HashSet::new));

		List<AdminLocationResponses.AmapCandidate> items = new ArrayList<>(pois.size());
		for (int index = 0; index < pois.size(); index++) {
			JsonNode poi = pois.get(index);
			items.add(new AdminLocationResponses.AmapCandidate(
					poiIds.get(index),
					text(poi, "name"),
					text(poi, "typecode"),
					text(poi, "address"),
					text(poi, "location"),
					text(poi, "adcode"),
					savedPoiIds.contains(poiIds.get(index)),
					poi));
		}

		return new AdminLocationResponses.Page<>(
				searchResult.pageNum(),
				searchResult.pageSize(),
				totalElements,
				totalPages,
				searchResult.pageNum() < totalPages,
				searchResult.pageNum() > 1,
				items);
	}

	AdminLocationResponses.Page<AdminLocationResponses.SavedLocation> savedLocations(
			String regionCode, String typeGroup, Integer requestedPage, Integer requestedPageSize) {
		ValidatedRegion region = validateRegion(regionCode);
		if (typeGroup != null) {
			typeCodesForGroup(typeGroup);
		}
		PageParameters page = validatePage(requestedPage, requestedPageSize, DATABASE_MAX_PAGE_SIZE, Integer.MAX_VALUE);
		var locations = this.locationRepository.findAdminPage(
				region == null ? null : region.code(),
				region == null ? null : region.level(),
				typeGroup,
				PageRequest.of(page.page() - 1, page.pageSize()));
		return new AdminLocationResponses.Page<>(
				locations.getNumber() + 1,
				locations.getSize(),
				locations.getTotalElements(),
				locations.getTotalPages(),
				locations.hasNext(),
				locations.hasPrevious(),
				locations.getContent().stream().map(AdminLocationResponses.SavedLocation::from).toList());
	}

	AdminLocationResponses.LocationDetail locationDetail(String requestedPoiId) {
		String poiId = validatePoiId(requestedPoiId);
		PawtripLocation location = findLocation(poiId);
		return toLocationDetail(location);
	}

	AdminLocationResponses.LocationDetail createLocation(AdminLocationRequests.SaveLocation request) {
		if (request == null) {
			throw invalidQuery();
		}
		String poiId = validatePoiId(request.poiId());
		List<String> typeCodes = typeCodesForGroup(request.typeGroup());
		validateVisitHours(request.minVisitHours(), request.maxVisitHours());
		if (this.locationRepository.existsByPoiId(poiId)) {
			throw locationConflict();
		}

		JsonNode poi = this.placeSearchPort.getPlaceById(poiId);
		validatePoi(poiId, typeCodes, poi);
		Coordinates coordinates = coordinates(text(poi, "location"));
		String businessJson = jsonValue(poi.get("business"));
		List<LocationWriteService.PhotoMetadata> photos = photoMetadata(poi.get("photos"));
		PawtripLocation location = new PawtripLocation(
				poiId,
				text(poi, "name"),
				text(poi, "typecode"),
				request.typeGroup(),
				text(poi, "address"),
				coordinates.longitude(),
				coordinates.latitude(),
				nonBlank(text(poi, "adcode")),
				poi.toString(),
				businessJson,
				request.minVisitHours(),
				request.maxVisitHours());
		PawtripLocation savedLocation;
		try {
			savedLocation = this.locationWriteService.create(location, photos);
		}
		catch (LocationWriteService.DuplicatePoiIdException exception) {
			throw locationConflict();
		}
		return locationDetail(poiId);
	}

	AdminLocationResponses.LocationDetail updateLocation(String requestedPoiId,
			AdminLocationRequests.UpdateVisitHours request) {
		String poiId = validatePoiId(requestedPoiId);
		if (request == null) {
			throw invalidQuery();
		}
		validateVisitHours(request.minVisitHours(), request.maxVisitHours());
		PawtripLocation existing = findLocation(poiId);
		if (!ATTRACTION_TYPE_GROUP.equals(existing.getTypeGroup())
				&& (request.minVisitHours() != null || request.maxVisitHours() != null)) {
			throw invalidQuery();
		}
		this.locationWriteService.updateVisitHours(poiId, request.minVisitHours(), request.maxVisitHours());
		return locationDetail(poiId);
	}

	private AdminLocationResponses.LocationDetail toLocationDetail(PawtripLocation location) {
		List<AdminLocationResponses.PhotoDetail> photos = this.photoRepository
				.findAllByLocationIdOrderByPhotoOrderAsc(location.getId())
				.stream()
				.map(photo -> new AdminLocationResponses.PhotoDetail(
						photo.getId(),
						photo.getPhotoOrder(),
						photo.getTitle(),
						photo.getSourceUrl(),
						parseJson(photo.getSourceJson())))
				.toList();
		return new AdminLocationResponses.LocationDetail(
				location.getPoiId(),
				location.getTypeGroup(),
				location.getMinVisitHours(),
				location.getMaxVisitHours(),
				parseJson(location.getPoiJson()),
				parseJson(location.getBusinessJson()),
				photos);
	}

	private PawtripLocation findLocation(String poiId) {
		return this.locationRepository.findByPoiId(poiId)
				.orElseThrow(() -> new ApiException(ApiErrorCode.LOCATION_NOT_FOUND, "Saved location was not found"));
	}

	private static void validatePoi(String poiId, List<String> typeCodes, JsonNode poi) {
		if (poi == null || !poi.isObject() || !poiId.equals(text(poi, "id"))) {
			throw upstreamPlaceFailure();
		}
		String name = text(poi, "name");
		String actualTypeCode = text(poi, "typecode");
		if (name == null || name.isBlank() || actualTypeCode == null || actualTypeCode.isBlank()) {
			throw upstreamPlaceFailure();
		}
		boolean typeMatches = false;
		for (String actual : actualTypeCode.split("[;,|]")) {
			for (String expected : typeCodes) {
				if (actual.trim().startsWith(expected.substring(0, 2))) {
					typeMatches = true;
					break;
				}
			}
			if (typeMatches) {
				break;
			}
		}
		if (!typeMatches) {
			throw invalidQuery();
		}
	}

	private static List<LocationWriteService.PhotoMetadata> photoMetadata(JsonNode photos) {
		if (photos == null || photos.isNull()) {
			return List.of();
		}
		if (!photos.isArray()) {
			throw upstreamPlaceFailure();
		}
		List<LocationWriteService.PhotoMetadata> metadata = new ArrayList<>(photos.size());
		for (int index = 0; index < photos.size(); index++) {
			JsonNode photo = photos.get(index);
			if (!photo.isObject()) {
				throw upstreamPlaceFailure();
			}
			String sourceUrl = nonBlank(text(photo, "url"));
			metadata.add(new LocationWriteService.PhotoMetadata(
					index,
					photo.toString(),
					text(photo, "title"),
					sourceUrl == null ? "" : sourceUrl));
		}
		return List.copyOf(metadata);
	}

	private static Coordinates coordinates(String location) {
		if (location == null || location.isBlank()) {
			return new Coordinates(null, null);
		}
		String[] values = location.split(",", -1);
		if (values.length != 2) {
			throw upstreamPlaceFailure();
		}
		try {
			double longitude = Double.parseDouble(values[0].trim());
			double latitude = Double.parseDouble(values[1].trim());
			if (!Double.isFinite(longitude) || !Double.isFinite(latitude)
					|| longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) {
				throw upstreamPlaceFailure();
			}
			return new Coordinates(longitude, latitude);
		}
		catch (NumberFormatException exception) {
			throw upstreamPlaceFailure();
		}
	}

	private static void validateVisitHours(Integer minVisitHours, Integer maxVisitHours) {
		if ((minVisitHours != null && minVisitHours < 0)
				|| (maxVisitHours != null && maxVisitHours < 0)
				|| (minVisitHours != null && maxVisitHours != null && minVisitHours > maxVisitHours)) {
			throw invalidQuery();
		}
	}

	private static String validatePoiId(String poiId) {
		if (poiId == null || !poiId.matches("[A-Za-z0-9_-]{1,64}")) {
			throw invalidQuery();
		}
		return poiId;
	}

	private static String jsonValue(JsonNode value) {
		return value == null || value.isNull() ? "{}" : value.toString();
	}

	private JsonNode parseJson(String json) {
		return this.objectMapper.readTree(json);
	}

	private static String nonBlank(String value) {
		return value == null || value.isBlank() ? null : value;
	}

	private static PlaceSearchException upstreamPlaceFailure() {
		return new PlaceSearchException(PlaceSearchException.Code.UPSTREAM_FAILURE, "AMap returned invalid POI details");
	}

	private static ApiException locationConflict() {
		return new ApiException(ApiErrorCode.LOCATION_CONFLICT, "Location is already saved");
	}

	private record Coordinates(Double longitude, Double latitude) {
	}

	private ValidatedRegion validateRegion(String regionCode) {
		if (regionCode == null) {
			return null;
		}
		if (!regionCode.matches("\\d{6}")) {
			throw invalidQuery();
		}
		AdministrativeRegion region = this.regionRepository.findById(regionCode).orElseThrow(AdminLocationService::invalidQuery);
		if (!region.getLevel().equals("province") && !region.getLevel().equals("city")) {
			throw invalidQuery();
		}
		return new ValidatedRegion(region.getAdcode(), region.getLevel());
	}

	private static List<String> typeCodesForGroup(String typeGroup) {
		if (typeGroup == null || typeGroup.isBlank()) {
			throw invalidQuery();
		}
		List<String> typeCodes = TYPE_CODES_BY_GROUP.get(typeGroup);
		if (typeCodes == null) {
			throw invalidQuery();
		}
		return typeCodes;
	}

	private static PageParameters validatePage(Integer requestedPage, Integer requestedPageSize, int maxPageSize,
			int maxPage) {
		int page = requestedPage == null ? DEFAULT_PAGE : requestedPage;
		int pageSize = requestedPageSize == null ? DEFAULT_PAGE_SIZE : requestedPageSize;
		if (page < 1 || page > maxPage || pageSize < 1 || pageSize > maxPageSize) {
			throw invalidQuery();
		}
		return new PageParameters(page, pageSize);
	}

	private static String requiredPoiId(JsonNode poi) {
		String poiId = text(poi, "id");
		if (poiId == null || poiId.isBlank()) {
			throw new PlaceSearchException(PlaceSearchException.Code.UPSTREAM_FAILURE, "AMap returned an invalid POI");
		}
		return poiId;
	}

	private static String text(JsonNode object, String field) {
		return object.path(field).asString(null);
	}

	private static ApiException invalidQuery() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid location query");
	}

	private record PageParameters(int page, int pageSize) {
	}

	private record ValidatedRegion(String code, String level) {
	}
}
