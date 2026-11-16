package com.pawtrip.server.trip;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.error.UnauthenticatedException;
import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
import com.pawtrip.server.location.PawtripLocation;
import com.pawtrip.server.location.PawtripLocationRepository;
import com.pawtrip.server.pet.PetRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class TripService {

	private static final Set<String> TRANSPORT_MODES = Set.of("flight", "high_speed_rail", "train", "drive");

	private final TripRepository tripRepository;

	private final AppUserRepository appUserRepository;

	private final AdministrativeRegionRepository regionRepository;

	private final PetRepository petRepository;

	private final PawtripLocationRepository locationRepository;

	private final TripPlanValidator planValidator;

	TripService(TripRepository tripRepository, AppUserRepository appUserRepository,
			AdministrativeRegionRepository regionRepository, PetRepository petRepository,
			PawtripLocationRepository locationRepository, TripPlanValidator planValidator) {
		this.tripRepository = tripRepository;
		this.appUserRepository = appUserRepository;
		this.regionRepository = regionRepository;
		this.petRepository = petRepository;
		this.locationRepository = locationRepository;
		this.planValidator = planValidator;
	}

	List<TripResponses.TripSummary> trips(String username) {
		Long userId = userId(username);
		return this.tripRepository.findAllByUserIdOrderByIdAsc(userId).stream()
			.map(TripResponses.TripSummary::from)
			.toList();
	}

	TripResponses.TripDetail trip(String username, long tripId) {
		return TripResponses.TripDetail.from(findOwnedTrip(userId(username), tripId), this.planValidator);
	}

	@Transactional
	TripResponses.TripDetail create(String username, TripRequests.SaveTrip request) {
		Long userId = userId(username);
		ValidatedTrip validated = validate(userId, request, true);
		Trip saved = this.tripRepository.save(new Trip(userId, validated.name(), validated.cityAdcode(),
				validated.petId(), validated.totalDays(), validated.transportMode(), validated.planJson()));
		return TripResponses.TripDetail.from(saved, this.planValidator);
	}

	@Transactional
	TripResponses.TripDetail update(String username, long tripId, TripRequests.SaveTrip request) {
		Long userId = userId(username);
		Trip existing = findOwnedTrip(userId, tripId);
		ValidatedTrip validated = validate(userId, request, false);
		existing.update(validated.name(), validated.totalDays(), validated.planJson(), validated.transportMode());
		return TripResponses.TripDetail.from(this.tripRepository.save(existing), this.planValidator);
	}

	@Transactional
	void delete(String username, long tripId) {
		this.tripRepository.delete(findOwnedTrip(userId(username), tripId));
	}

	private ValidatedTrip validate(Long userId, TripRequests.SaveTrip request, boolean requireBinding) {
		if (request == null) {
			throw invalid();
		}
		String name = request.name() == null ? "" : request.name().trim();
		if (name.isEmpty()) {
			throw invalid();
		}
		String transportMode = request.transportMode();
		if (transportMode != null && !TRANSPORT_MODES.contains(transportMode)) {
			throw invalid();
		}
		if (!requireBinding && (request.plan() == null || request.plan().isNull())) {
			throw invalid();
		}
		TripPlan plan = this.planValidator.validate(request.plan(), request.totalDays());
		validatePoiIds(plan);
		if (!requireBinding) {
			return new ValidatedTrip(name, null, null, request.totalDays(), this.planValidator.serialize(plan),
					transportMode);
		}
		String cityAdcode = request.cityAdcode();
		if (cityAdcode == null || cityAdcode.isBlank() || !isCity(cityAdcode)) {
			throw invalid();
		}
		Long petId = request.petId();
		if (petId == null || this.petRepository.findByIdAndUserId(petId, userId).isEmpty()) {
			throw invalid();
		}
		return new ValidatedTrip(name, cityAdcode, petId, request.totalDays(), this.planValidator.serialize(plan),
				transportMode);
	}

	private boolean isCity(String adcode) {
		return this.regionRepository.findById(adcode)
			.map(AdministrativeRegion::getLevel)
			.filter("city"::equals)
			.isPresent();
	}

	private void validatePoiIds(TripPlan plan) {
		Set<String> poiIds = new LinkedHashSet<>();
		for (TripPlan.TripDay day : plan.days()) {
			for (TripPlan.TripStop stop : day.stops()) {
				poiIds.add(stop.poiId());
			}
		}
		for (TripPlan.TripStopRef ref : plan.unscheduled()) {
			poiIds.add(ref.poiId());
		}
		if (poiIds.isEmpty()) {
			return;
		}
		Set<String> existing = this.locationRepository.findAllByPoiIdIn(poiIds).stream()
			.map(PawtripLocation::getPoiId)
			.collect(Collectors.toSet());
		if (!existing.containsAll(poiIds)) {
			throw invalid();
		}
	}

	private Trip findOwnedTrip(Long userId, long tripId) {
		return this.tripRepository.findByIdAndUserId(tripId, userId)
			.orElseThrow(TripNotFoundException::new);
	}

	private Long userId(String username) {
		return this.appUserRepository.findByUsername(username)
			.orElseThrow(UnauthenticatedException::new)
			.getId();
	}

	private static ApiException invalid() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid trip request");
	}

	private record ValidatedTrip(String name, String cityAdcode, Long petId, int totalDays, String planJson,
			String transportMode) {
	}

}
