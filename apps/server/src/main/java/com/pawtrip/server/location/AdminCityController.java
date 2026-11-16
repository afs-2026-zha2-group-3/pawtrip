package com.pawtrip.server.location;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/cities")
class AdminCityController {

	private final AdminCityService adminCityService;

	AdminCityController(AdminCityService adminCityService) {
		this.adminCityService = adminCityService;
	}

	@GetMapping
	AdminLocationResponses.Page<AdminCityResponses.CityListItem> cities(
			@RequestParam(required = false) String provinceAdcode,
			@RequestParam(required = false) String level,
			@RequestParam(required = false) String keyword,
			@RequestParam(defaultValue = "1") Integer page,
			@RequestParam(defaultValue = "10") Integer pageSize) {
		return this.adminCityService.cities(provinceAdcode, level, keyword, page, pageSize);
	}

	@GetMapping("/{adcode}")
	AdminCityResponses.CityDetail cityDetail(@PathVariable String adcode) {
		return this.adminCityService.cityDetail(adcode);
	}

	@PatchMapping("/{adcode}")
	AdminCityResponses.CityDetail updateCity(@PathVariable String adcode,
			@RequestBody AdminCityRequests.UpdateCity request) {
		return this.adminCityService.updateCity(adcode, request);
	}
}
