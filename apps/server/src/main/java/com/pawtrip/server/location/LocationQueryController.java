package com.pawtrip.server.location;

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

	@GetMapping("/attractions")
	LocationQueryResponses.Page<LocationQueryResponses.AttractionSummary> attractions(
			@RequestParam String regionCode,
			@RequestParam(defaultValue = "false") boolean includeWithoutRules,
			@RequestParam(required = false) Integer page,
			@RequestParam(required = false) Integer pageSize) {
		return this.locationQueryService.attractions(regionCode, includeWithoutRules, page, pageSize);
	}

	@GetMapping("/{poiId}")
	LocationQueryResponses.LocationDetail detail(@PathVariable String poiId) {
		return this.locationQueryService.detail(poiId);
	}

}
