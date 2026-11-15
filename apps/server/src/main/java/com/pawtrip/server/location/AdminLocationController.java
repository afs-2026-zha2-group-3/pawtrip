package com.pawtrip.server.location;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
class AdminLocationController {

	private final AdminLocationService adminLocationService;

	AdminLocationController(AdminLocationService adminLocationService) {
		this.adminLocationService = adminLocationService;
	}

	@GetMapping("/regions")
	List<AdminLocationResponses.RegionOption> regions() {
		return this.adminLocationService.regions();
	}

	@GetMapping("/location-types")
	List<AdminLocationResponses.LocationTypeOption> locationTypes() {
		return this.adminLocationService.locationTypes();
	}

	@GetMapping("/locations/amap")
	AdminLocationResponses.Page<AdminLocationResponses.AmapCandidate> amapLocations(
			@RequestParam(required = false) String regionCode,
			@RequestParam(required = false) String typeGroup,
			@RequestParam(defaultValue = "1") Integer page,
			@RequestParam(defaultValue = "10") Integer pageSize) {
		return this.adminLocationService.searchAmapLocations(regionCode, typeGroup, page, pageSize);
	}

	@GetMapping("/locations/{poiId}")
	AdminLocationResponses.LocationDetail locationDetail(@PathVariable String poiId) {
		return this.adminLocationService.locationDetail(poiId);
	}

	@PostMapping("/locations")
	ResponseEntity<AdminLocationResponses.LocationDetail> createLocation(
			@RequestBody AdminLocationRequests.SaveLocation request) {
		AdminLocationResponses.LocationDetail location = this.adminLocationService.createLocation(request);
		return ResponseEntity.created(URI.create("/api/admin/locations/" + location.poiId())).body(location);
	}

	@PatchMapping("/locations/{poiId}")
	AdminLocationResponses.LocationDetail updateLocation(@PathVariable String poiId,
			@RequestBody AdminLocationRequests.UpdateVisitHours request) {
		return this.adminLocationService.updateLocation(poiId, request);
	}


	@GetMapping("/locations")
	AdminLocationResponses.Page<AdminLocationResponses.SavedLocation> savedLocations(
			@RequestParam(required = false) String regionCode,
			@RequestParam(required = false) String typeGroup,
			@RequestParam(defaultValue = "1") Integer page,
			@RequestParam(defaultValue = "10") Integer pageSize) {
		return this.adminLocationService.savedLocations(regionCode, typeGroup, page, pageSize);
	}
}
