package com.pawtrip.server.trip;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.pawtrip.server.application.model.maps.RouteEstimateRequest;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Endpoint;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Mode;
import com.pawtrip.server.application.model.maps.RouteEstimateResult;
import com.pawtrip.server.application.port.maps.RouteEstimatePort;
import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.error.UnauthenticatedException;
import com.pawtrip.server.location.PawtripLocation;
import com.pawtrip.server.location.PawtripLocationRepository;

import org.springframework.stereotype.Service;

@Service
class TripRouteEstimateService {

	private static final Set<String> MODES = Set.of("walk", "drive");

	private final TripRepository tripRepository;

	private final AppUserRepository appUserRepository;

	private final PawtripLocationRepository locationRepository;

	private final RouteEstimatePort routeEstimatePort;

	TripRouteEstimateService(TripRepository tripRepository, AppUserRepository appUserRepository,
			PawtripLocationRepository locationRepository, RouteEstimatePort routeEstimatePort) {
		this.tripRepository = tripRepository;
		this.appUserRepository = appUserRepository;
		this.locationRepository = locationRepository;
		this.routeEstimatePort = routeEstimatePort;
	}

	TripResponses.RouteEstimate estimate(String username, long tripId, String fromPoiId, String toPoiId,
			String mode) {
		Long userId = this.appUserRepository.findByUsername(username)
			.orElseThrow(UnauthenticatedException::new)
			.getId();
		this.tripRepository.findByIdAndUserId(tripId, userId).orElseThrow(TripNotFoundException::new);
		if (mode == null || !MODES.contains(mode) || isBlank(fromPoiId) || isBlank(toPoiId)) {
			throw invalid();
		}
		Map<String, PawtripLocation> locations = this.locationRepository
			.findAllByPoiIdIn(new LinkedHashSet<>(List.of(fromPoiId, toPoiId))).stream()
			.collect(Collectors.toMap(PawtripLocation::getPoiId, Function.identity()));
		PawtripLocation from = locations.get(fromPoiId);
		PawtripLocation to = locations.get(toPoiId);
		if (!hasCoordinates(from) || !hasCoordinates(to)) {
			throw invalid();
		}
		RouteEstimateResult raw = this.routeEstimatePort.estimate(new RouteEstimateRequest(
				endpoint(from), endpoint(to), "drive".equals(mode) ? Mode.DRIVE : Mode.WALK));
		int durationMinutes = (int) Math.ceil(raw.durationSeconds() / 60.0);
		if ("walk".equals(mode)) {
			return new TripResponses.RouteEstimate("walk", durationMinutes, 0.0, 0.0);
		}
		double taxiCost = raw.taxiCostYuan().doubleValue();
		return new TripResponses.RouteEstimate("drive", durationMinutes,
				round2(taxiCost * 0.8), round2(taxiCost * 1.2));
	}

	private static Endpoint endpoint(PawtripLocation location) {
		return new Endpoint(location.getPoiId(),
				BigDecimal.valueOf(location.getLongitude()),
				BigDecimal.valueOf(location.getLatitude()));
	}

	private static boolean hasCoordinates(PawtripLocation location) {
		return location != null && location.getLongitude() != null && location.getLatitude() != null;
	}

	private static boolean isBlank(String value) {
		return value == null || value.isBlank();
	}

	private static double round2(double value) {
		return Math.round(value * 100.0) / 100.0;
	}

	private static ApiException invalid() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid route estimate request");
	}

}