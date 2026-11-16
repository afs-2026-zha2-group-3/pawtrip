package com.pawtrip.server.policy;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cities")
class CityPetPolicyController {

	private final CityPetPolicyService cityPetPolicyService;

	CityPetPolicyController(CityPetPolicyService cityPetPolicyService) {
		this.cityPetPolicyService = cityPetPolicyService;
	}

	@GetMapping("/{adcode}/pet-policy")
	CityPetPolicyResponses.PetPolicy policy(@PathVariable String adcode,
			@RequestParam(required = false) String breed) {
		return this.cityPetPolicyService.policyFor(adcode, breed);
	}

}
