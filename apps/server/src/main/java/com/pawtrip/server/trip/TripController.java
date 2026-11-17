package com.pawtrip.server.trip;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/trips")
class TripController {

	private final TripService tripService;

	private final TripRouteEstimateService routeEstimateService;

	TripController(TripService tripService, TripRouteEstimateService routeEstimateService) {
		this.tripService = tripService;
		this.routeEstimateService = routeEstimateService;
	}

	@GetMapping
	List<TripResponses.TripSummary> trips(Authentication authentication) {
		return this.tripService.trips(authentication.getName());
	}

	@GetMapping("/{tripId}")
	TripResponses.TripDetail trip(@PathVariable Long tripId, Authentication authentication) {
		return this.tripService.trip(authentication.getName(), tripId);
	}

	@GetMapping("/{tripId}/route-estimate")
	TripResponses.RouteEstimate routeEstimate(@PathVariable Long tripId,
			@RequestParam(required = false) String fromPoiId,
			@RequestParam(required = false) String toPoiId,
			@RequestParam(required = false) String mode,
			Authentication authentication) {
		return this.routeEstimateService.estimate(authentication.getName(), tripId, fromPoiId, toPoiId, mode);
	}

	@PostMapping
	ResponseEntity<TripResponses.TripDetail> create(@RequestBody TripRequests.SaveTrip request,
			Authentication authentication) {
		TripResponses.TripDetail trip = this.tripService.create(authentication.getName(), request);
		return ResponseEntity.created(URI.create("/api/trips/" + trip.id())).body(trip);
	}

	@PutMapping("/{tripId}")
	TripResponses.TripDetail update(@PathVariable Long tripId, @RequestBody TripRequests.SaveTrip request,
			Authentication authentication) {
		return this.tripService.update(authentication.getName(), tripId, request);
	}

	@DeleteMapping("/{tripId}")
	ResponseEntity<Void> delete(@PathVariable Long tripId, Authentication authentication) {
		this.tripService.delete(authentication.getName(), tripId);
		return ResponseEntity.noContent().build();
	}

}
