package com.pawtrip.server.infrastructure.amap.api;

import com.pawtrip.server.application.model.maps.RouteEstimateException;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Endpoint;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Mode;
import com.pawtrip.server.application.model.maps.RouteEstimateResult;
import com.pawtrip.server.application.port.maps.RouteEstimatePort;
import com.pawtrip.server.infrastructure.amap.transport.AmapTransport;
import com.pawtrip.server.infrastructure.amap.transport.AmapTransportException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;

@Component
public class AmapRouteEstimateAdapter implements RouteEstimatePort {

	private static final String DRIVING_PATH = "/v5/direction/driving";
	private static final String WALKING_PATH = "/v5/direction/walking";

	private final AmapTransport transport;

	public AmapRouteEstimateAdapter(AmapTransport transport) {
		this.transport = transport;
	}

	@Override
	public RouteEstimateResult estimate(RouteEstimateRequest request) {
		String path = request.mode() == Mode.DRIVE ? DRIVING_PATH : WALKING_PATH;
		JsonNode response = request(path, Map.of(
				"origin", formatCoordinates(request.origin()),
				"destination", formatCoordinates(request.destination()),
				"show_fields", "cost",
				"origin_id", request.origin().poiId(),
				"destination_id", request.destination().poiId()));
		if (!isSuccessful(response)) {
			throw upstreamFailure();
		}
		JsonNode firstPath = response.path("route").path("paths").path(0);
		long durationSeconds = parseLong(firstPath.path("cost").path("duration").asString(null));
		BigDecimal taxiCostYuan = request.mode() == Mode.DRIVE
				? parseDecimal(response.path("route").path("taxi_cost").asString(null))
				: null;
		return new RouteEstimateResult(taxiCostYuan, durationSeconds);
	}

	private JsonNode request(String path, Map<String, String> parameters) {
		try {
			return transport.getJson(path, parameters);
		} catch (AmapTransportException exception) {
			if (exception.code() == AmapTransportException.Code.MISSING_API_KEY) {
				throw new RouteEstimateException(
						RouteEstimateException.Code.MISSING_CONFIGURATION, "AMAP_API_KEY is not configured");
			}
			throw upstreamFailure();
		}
	}

	private static String formatCoordinates(Endpoint endpoint) {
		return formatCoordinate(endpoint.longitude()) + "," + formatCoordinate(endpoint.latitude());
	}

	private static String formatCoordinate(BigDecimal value) {
		return value.setScale(6, RoundingMode.DOWN).toPlainString();
	}

	private static boolean isSuccessful(JsonNode response) {
		return "1".equals(response.path("status").asString(""))
				&& "10000".equals(response.path("infocode").asString(""));
	}

	private static long parseLong(String value) {
		if (value == null || value.isBlank()) {
			throw upstreamFailure();
		}
		try {
			return Long.parseLong(value.trim());
		} catch (NumberFormatException exception) {
			throw upstreamFailure();
		}
	}

	private static BigDecimal parseDecimal(String value) {
		if (value == null || value.isBlank()) {
			throw upstreamFailure();
		}
		try {
			return new BigDecimal(value.trim());
		} catch (NumberFormatException exception) {
			throw upstreamFailure();
		}
	}

	private static RouteEstimateException upstreamFailure() {
		return new RouteEstimateException(
				RouteEstimateException.Code.UPSTREAM_FAILURE, "AMap route estimate failed");
	}
}