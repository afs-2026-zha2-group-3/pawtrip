package com.pawtrip.server.location;

import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/locations")
class LocationQueryController {

	private final LocationQueryService locationQueryService;

	LocationQueryController(LocationQueryService locationQueryService) {
		this.locationQueryService = locationQueryService;
	}

	@GetMapping("/types")
	List<LocationQueryResponses.LocationTypeOption> locationTypes() {
		return LocationTypeCatalog.options();
	}

	@GetMapping
	LocationQueryResponses.Page<LocationQueryResponses.LocationSummary> locations(
			@RequestParam(required = false) String regionCode,
			@RequestParam(required = false) String typeGroup,
			@RequestParam(defaultValue = "false") boolean petFriendlyOnly,
			@RequestParam(required = false) String nearPoiId,
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer pageSize,
			Authentication authentication) {
		return this.locationQueryService.locations(
				regionCode, typeGroup, petFriendlyOnly, nearPoiId, page, pageSize, isAdministrator(authentication));
	}

	private static boolean isAdministrator(Authentication authentication) {
		return authentication != null && authentication.getAuthorities().stream()
				.anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
	}

	@GetMapping("/{poiId}")
	LocationQueryResponses.LocationDetail detail(@PathVariable String poiId) {
		return this.locationQueryService.detail(poiId);
	}

	@GetMapping("/{poiId}/nearby-services")
	LocationQueryResponses.NearbyServices nearbyServices(@PathVariable String poiId) {
		return this.locationQueryService.nearbyServices(poiId);
	}

}
