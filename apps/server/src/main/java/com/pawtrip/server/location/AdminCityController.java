package com.pawtrip.server.location;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cities")
class AdminCityController {

	private final AdminCityService adminCityService;

	AdminCityController(AdminCityService adminCityService) {
		this.adminCityService = adminCityService;
	}

	@GetMapping("/{adcode}/allowed-breeds")
	AdminCityResponses.AllowedBreeds allowedBreeds(@PathVariable String adcode) {
		return this.adminCityService.allowedBreeds(adcode);
	}

	@PutMapping("/{adcode}/allowed-breeds")
	AdminCityResponses.AllowedBreeds updateAllowedBreeds(@PathVariable String adcode,
			@RequestBody AdminCityRequests.UpdateAllowedBreeds request) {
		return this.adminCityService.updateAllowedBreeds(adcode, request);
	}

}
