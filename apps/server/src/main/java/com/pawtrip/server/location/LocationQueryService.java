package com.pawtrip.server.location;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

@Service
class LocationQueryService {

	private static final int DEFAULT_PAGE = 1;
	private static final int DEFAULT_PAGE_SIZE = 20;
	private static final int MAX_PAGE_SIZE = 100;
	private static final double EARTH_RADIUS_METERS = 6_371_000;
	private static final double NEARBY_RADIUS_METERS = 5_000;

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
			boolean petFriendlyOnly, String nearPoiId, Integer requestedPage, Integer requestedPageSize,
			boolean allowUnrestrictedRegion) {
		if (regionCode == null && !allowUnrestrictedRegion) {
			throw invalidQuery();
		}
		ValidatedRegion region = validateOptionalRegion(regionCode);
		if (typeGroup != null && (typeGroup.isBlank() || LocationTypeCatalog.typeCodesForGroup(typeGroup) == null)) {
			throw invalidQuery();
		}
		PageParameters page = validatePage(requestedPage, requestedPageSize);
		if (nearPoiId == null) {
			return databasePage(region, typeGroup, petFriendlyOnly, page);
		}
		return nearbyPage(region, typeGroup, petFriendlyOnly, nearPoiId, page);
	}

	LocationQueryResponses.LocationDetail detail(String poiId) {
		return this.locationRepository.findByPoiId(poiId)
			.map(this::toDetail)
			.orElseThrow(() -> new ApiException(ApiErrorCode.LOCATION_NOT_FOUND, "Saved location was not found"));
	}

	LocationQueryResponses.NearbyServices nearbyServices(String poiId) {
		PawtripLocation anchor = this.locationRepository.findByPoiId(poiId)
			.orElseThrow(() -> new ApiException(ApiErrorCode.LOCATION_NOT_FOUND, "Saved location was not found"));
		if (anchor.getLongitude() == null || anchor.getLatitude() == null) {
			return new LocationQueryResponses.NearbyServices(null, null);
		}
		return new LocationQueryResponses.NearbyServices(
				nearestService(anchor, LocationTypeCatalog.PET_HOSPITAL_KEY),
				nearestService(anchor, LocationTypeCatalog.PET_SUPPLIES_KEY));
	}

	private LocationQueryResponses.NearbyService nearestService(PawtripLocation anchor, String typeGroup) {
		String regionCode = anchor.getRegionCode();
		String regionLevel = regionCode == null ? null : "city";
		return this.locationRepository.findLocations(regionCode, regionLevel, typeGroup, 0)
			.stream()
			.filter(candidate -> candidate.getLongitude() != null && candidate.getLatitude() != null)
			.map(candidate -> new NearbyLocation(candidate,
					distanceMeters(anchor.getLatitude(), anchor.getLongitude(), candidate.getLatitude(),
							candidate.getLongitude())))
			.min(Comparator.comparingDouble(NearbyLocation::distanceMeters)
				.thenComparing(candidate -> candidate.location().getId()))
			.map(candidate -> toNearbyService(candidate.location(), Math.round(candidate.distanceMeters())))
			.orElse(null);
	}

	private LocationQueryResponses.NearbyService toNearbyService(PawtripLocation location, long distanceMeters) {
		JsonNode poi = parseJson(location.getPoiJson());
		String openingHours = businessField(location, poi, "opentime_week");
		if (openingHours == null) {
			openingHours = businessField(location, poi, "opentime_today");
		}
		return new LocationQueryResponses.NearbyService(location.getPoiId(), location.getName(),
				location.getAddress(), distanceMeters, openingHours);
	}

	private LocationQueryResponses.LocationDetail toDetail(PawtripLocation location) {
		JsonNode poi = parseJson(location.getPoiJson());
		String coverPhotoUrl = coverPhotos(List.of(location)).get(location.getId());
		return LocationQueryResponses.LocationDetail.from(location, coverPhotoUrl,
				businessField(location, poi, "rating"), businessField(location, poi, "keytag"),
				businessField(location, poi, "business_area"), typeName(poi), regionName(poi),
				openingHours(location, poi), businessField(location, poi, "opentime_today"),
				businessField(location, poi, "tel"));
	}

	private static String typeName(JsonNode poi) {
		String value = text(poi, "type");
		if (value == null) {
			return null;
		}
		List<String> parts = new ArrayList<>();
		for (String part : value.split(";")) {
			String item = part.trim();
			if (!item.isEmpty() && !parts.contains(item)) {
				parts.add(item);
			}
		}
		return parts.isEmpty() ? null : String.join("、", parts);
	}

	private static String regionName(JsonNode poi) {
		List<String> parts = new ArrayList<>();
		for (String field : List.of("pname", "cityname", "adname")) {
			String value = text(poi, field);
			if (value != null && !parts.contains(value)) {
				parts.add(value);
			}
		}
		return parts.isEmpty() ? null : String.join("", parts);
	}

	private String openingHours(PawtripLocation location, JsonNode poi) {
		String weekly = businessField(location, poi, "opentime_week");
		return weekly != null ? weekly : businessField(location, poi, "opentime_today");
	}

	private JsonNode parseJson(String json) {
		try {
			return this.objectMapper.readTree(json == null || json.isBlank() ? "{}" : json);
		}
		catch (RuntimeException exception) {
			return this.objectMapper.readTree("{}");
		}
	}

	private static String firstPhotoUrl(JsonNode poi) {
		JsonNode photos = poi.path("photos");
		if (!photos.isArray()) {
			return null;
		}
		String fallback = null;
		for (JsonNode photo : photos) {
			String url = text(photo, "url");
			if (url == null) {
				continue;
			}
			if (url.startsWith("https://")) {
				return url;
			}
			if (fallback == null) {
				fallback = url;
			}
		}
		return fallback;
	}

	private static String text(JsonNode object, String field) {
		JsonNode value = object.path(field);
		if (value.isNull() || value.isMissingNode()) {
			return null;
		}
		String text;
		if (value.isString()) {
			text = value.asString(null);
		}
		else if (value.isNumber() || value.isBoolean()) {
			text = value.toString();
		}
		else {
			return null;
		}
		return text == null || text.isBlank() ? null : text;
	}

	private LocationQueryResponses.Page<LocationQueryResponses.LocationSummary> databasePage(ValidatedRegion region,
			String typeGroup, boolean petFriendlyOnly, PageParameters page) {
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
							covers.get(location.getId()), rating(location), keytag(location), null))
					.toList());
	}

	private LocationQueryResponses.Page<LocationQueryResponses.LocationSummary> nearbyPage(ValidatedRegion region,
			String typeGroup, boolean petFriendlyOnly, String nearPoiId, PageParameters page) {
		PawtripLocation anchor = this.locationRepository.findByPoiId(nearPoiId)
			.orElseThrow(LocationQueryService::invalidNearbyAnchor);
		if (!LocationTypeCatalog.ATTRACTION_KEY.equals(anchor.getTypeGroup()) || anchor.getLongitude() == null
				|| anchor.getLatitude() == null) {
			throw invalidNearbyAnchor();
		}
		List<NearbyLocation> nearby = this.locationRepository
			.findLocations(region == null ? null : region.code(), region == null ? null : region.level(), typeGroup,
					petFriendlyOnly ? 1 : 0)
			.stream()
			.filter(candidate -> candidate.getLongitude() != null && candidate.getLatitude() != null)
			.map(candidate -> new NearbyLocation(candidate,
					distanceMeters(anchor.getLatitude(), anchor.getLongitude(), candidate.getLatitude(),
							candidate.getLongitude())))
			.filter(candidate -> candidate.distanceMeters() <= NEARBY_RADIUS_METERS)
			.sorted(Comparator.comparingDouble(NearbyLocation::distanceMeters)
				.thenComparing(candidate -> candidate.location().getId()))
			.toList();
		int from = Math.min((page.page() - 1) * page.pageSize(), nearby.size());
		int to = Math.min(from + page.pageSize(), nearby.size());
		List<NearbyLocation> pageItems = nearby.subList(from, to);
		Map<Long, String> covers = coverPhotos(pageItems.stream().map(NearbyLocation::location).toList());
		List<LocationQueryResponses.LocationSummary> items = pageItems.stream()
			.map(candidate -> LocationQueryResponses.LocationSummary.from(candidate.location(),
					covers.get(candidate.location().getId()), rating(candidate.location()),
					keytag(candidate.location()), Math.round(candidate.distanceMeters())))
			.toList();
		int totalPages = (nearby.size() + page.pageSize() - 1) / page.pageSize();
		return new LocationQueryResponses.Page<>(
				page.page(),
				page.pageSize(),
				nearby.size(),
				totalPages,
				page.page() < totalPages,
				page.page() > 1,
				items);
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
		for (PawtripLocation location : locations) {
			covers.computeIfAbsent(location.getId(),
					ignored -> firstPhotoUrl(parseJson(location.getPoiJson())));
		}
		return covers;
	}

	private String rating(PawtripLocation location) {
		return businessField(location, parseJson(location.getPoiJson()), "rating");
	}

	private String keytag(PawtripLocation location) {
		return businessField(location, parseJson(location.getPoiJson()), "keytag");
	}

	private String businessField(PawtripLocation location, JsonNode poi, String field) {
		String value = text(parseJson(location.getBusinessJson()), field);
		return value != null ? value : text(poi.path("business"), field);
	}

	static double distanceMeters(double latitude1, double longitude1, double latitude2, double longitude2) {
		double latitudeDelta = Math.toRadians(latitude2 - latitude1);
		double longitudeDelta = Math.toRadians(longitude2 - longitude1);
		double latitude1Radians = Math.toRadians(latitude1);
		double latitude2Radians = Math.toRadians(latitude2);
		double a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
				+ Math.cos(latitude1Radians) * Math.cos(latitude2Radians)
						* Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
		return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

	private static ApiException invalidNearbyAnchor() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid nearby anchor location");
	}

	private record ValidatedRegion(String code, String level) {
	}

	private record PageParameters(int page, int pageSize) {
	}

	private record NearbyLocation(PawtripLocation location, double distanceMeters) {
	}

}
