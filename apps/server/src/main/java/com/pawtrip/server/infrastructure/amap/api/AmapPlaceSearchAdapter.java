package com.pawtrip.server.infrastructure.amap.api;

import com.pawtrip.server.application.model.maps.KeywordPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.NearbyPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.PlaceSearchException;
import com.pawtrip.server.application.model.maps.PlaceSearchResult;
import com.pawtrip.server.application.port.maps.PlaceSearchPort;
import com.pawtrip.server.infrastructure.amap.transport.AmapTransport;
import com.pawtrip.server.infrastructure.amap.transport.AmapTransportException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class AmapPlaceSearchAdapter implements PlaceSearchPort {

	private static final Logger logger = LoggerFactory.getLogger(AmapPlaceSearchAdapter.class);
	private static final String TEXT_SEARCH_PATH = "/v5/place/text";
	private static final String AROUND_SEARCH_PATH = "/v5/place/around";
	private static final String DEFAULT_AROUND_TYPES = "050000|070000|120000";
	private static final int DEFAULT_PAGE_NUM = 1;
	private static final int DEFAULT_PAGE_SIZE = 10;
	private static final int MAX_PAGE_SIZE = 25;
	private static final int MAX_QUERY_RESULTS = 200;

	private final AmapTransport transport;

	public AmapPlaceSearchAdapter(AmapTransport transport) {
		this.transport = transport;
	}

	@Override
	public PlaceSearchResult searchByKeyword(KeywordPlaceSearchRequest request) {
		if (request == null) {
			throw invalidRequest();
		}
		String keywords = validateKeywords(request.keywords());
		Page page = validatePage(request.pageNum(), request.pageSize());
		Map<String, String> parameters = new LinkedHashMap<>();
		parameters.put("keywords", keywords);
		addPage(parameters, page);
		return search(TEXT_SEARCH_PATH, parameters, page);
	}

	@Override
	public PlaceSearchResult searchNearby(NearbyPlaceSearchRequest request) {
		if (request == null) {
			throw invalidRequest();
		}
		String location = formatLocation(request.longitude(), request.latitude());
		String keywords = optionalKeywords(request.keywords());
		String types = optionalTypes(request.types());
		int radius = request.radius() == null ? 5000 : request.radius();
		if (radius < 0 || radius > 50000) {
			throw invalidRequest();
		}
		Page page = validatePage(request.pageNum(), request.pageSize());

		Map<String, String> parameters = new LinkedHashMap<>();
		parameters.put("location", location);
		parameters.put("radius", Integer.toString(radius));
		if (keywords != null) {
			parameters.put("keywords", keywords);
		}
		if (types != null) {
			parameters.put("types", types);
		} else if (keywords == null) {
			parameters.put("types", DEFAULT_AROUND_TYPES);
		}
		addPage(parameters, page);
		return search(AROUND_SEARCH_PATH, parameters, page);
	}

	private PlaceSearchResult search(String path, Map<String, String> parameters, Page page) {
		JsonNode response;
		try {
			response = transport.getJson(path, parameters);
		} catch (AmapTransportException exception) {
			if (exception.code() == AmapTransportException.Code.MISSING_API_KEY) {
				throw new PlaceSearchException(
						PlaceSearchException.Code.MISSING_CONFIGURATION,
						"AMAP_API_KEY is not configured");
			}
			throw upstreamFailure(path);
		}

		if (!"1".equals(response.path("status").asString(""))
				|| !"10000".equals(response.path("infocode").asString(""))) {
			throw upstreamFailure(path);
		}

		long totalCount;
		try {
			totalCount = Long.parseLong(response.path("count").asString(""));
		} catch (NumberFormatException exception) {
			throw upstreamFailure(path);
		}
		JsonNode poisNode = response.get("pois");
		if (totalCount < 0 || poisNode == null || !poisNode.isArray()) {
			throw upstreamFailure(path);
		}

		List<JsonNode> pois = new ArrayList<>(poisNode.size());
		poisNode.forEach(pois::add);
		return new PlaceSearchResult(totalCount, page.pageNum(), page.pageSize(), pois);
	}

	private static String validateKeywords(String keywords) {
		if (keywords == null || keywords.isBlank() || codePointLength(keywords) > 80) {
			throw invalidRequest();
		}
		return keywords;
	}

	private static String optionalKeywords(String keywords) {
		if (keywords == null) {
			return null;
		}
		return validateKeywords(keywords);
	}

	private static String optionalTypes(String types) {
		if (types == null) {
			return null;
		}
		if (types.isBlank()) {
			throw invalidRequest();
		}
		return types;
	}

	private static String formatLocation(BigDecimal longitude, BigDecimal latitude) {
		if (!isValidCoordinate(longitude, new BigDecimal("-180"), new BigDecimal("180"))
				|| !isValidCoordinate(latitude, new BigDecimal("-90"), new BigDecimal("90"))) {
			throw invalidRequest();
		}
		return longitude.stripTrailingZeros().toPlainString()
				+ ","
				+ latitude.stripTrailingZeros().toPlainString();
	}

	private static boolean isValidCoordinate(BigDecimal coordinate, BigDecimal min, BigDecimal max) {
		return coordinate != null
				&& coordinate.compareTo(min) >= 0
				&& coordinate.compareTo(max) <= 0
				&& coordinate.stripTrailingZeros().scale() <= 6;
	}

	private static int codePointLength(String value) {
		return value.codePointCount(0, value.length());
	}

	private static Page validatePage(Integer requestedPageNum, Integer requestedPageSize) {
		int pageNum = requestedPageNum == null ? DEFAULT_PAGE_NUM : requestedPageNum;
		int pageSize = requestedPageSize == null ? DEFAULT_PAGE_SIZE : requestedPageSize;
		if (pageNum < 1
				|| pageSize < 1
				|| pageSize > MAX_PAGE_SIZE
				|| (long) pageNum * pageSize > MAX_QUERY_RESULTS) {
			throw invalidRequest();
		}
		return new Page(pageNum, pageSize);
	}

	private static void addPage(Map<String, String> parameters, Page page) {
		parameters.put("page_num", Integer.toString(page.pageNum()));
		parameters.put("page_size", Integer.toString(page.pageSize()));
	}

	private static PlaceSearchException invalidRequest() {
		return new PlaceSearchException(
				PlaceSearchException.Code.INVALID_ARGUMENT, "Invalid place search request");
	}

	private static PlaceSearchException upstreamFailure(String path) {
		logger.warn("AMap POI search failed: endpoint={}, category=upstream", path);
		return new PlaceSearchException(
				PlaceSearchException.Code.UPSTREAM_FAILURE, "AMap POI search failed");
	}

	private record Page(int pageNum, int pageSize) {}
}
