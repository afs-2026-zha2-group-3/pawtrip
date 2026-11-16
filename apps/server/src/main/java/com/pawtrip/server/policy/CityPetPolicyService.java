package com.pawtrip.server.policy;

import java.util.ArrayList;
import java.util.List;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
class CityPetPolicyService {

	private static final JsonMapper JSON = JsonMapper.builder().build();

	private final CityPetPolicyRepository policyRepository;

	private final AdministrativeRegionRepository regionRepository;

	CityPetPolicyService(CityPetPolicyRepository policyRepository, AdministrativeRegionRepository regionRepository) {
		this.policyRepository = policyRepository;
		this.regionRepository = regionRepository;
	}

	CityPetPolicyResponses.PetPolicy policyFor(String adcode, String breed) {
		AdministrativeRegion region = this.regionRepository.findById(adcode)
			.orElseThrow(() -> new ApiException(ApiErrorCode.CITY_NOT_FOUND, "City was not found"));

		return this.policyRepository.findById(adcode)
			.map((policy) -> coveredPolicy(adcode, region.getName(), policy, breed))
			.orElseGet(() -> new CityPetPolicyResponses.PetPolicy(adcode, region.getName(), false, null, List.of(),
					List.of(), null, null, null));
	}

	private static CityPetPolicyResponses.PetPolicy coveredPolicy(String adcode, String name, CityPetPolicy policy,
			String breed) {
		List<String> policies = parseStringArray(policy.getPoliciesJson());
		List<String> bannedBreeds = parseStringArray(policy.getBannedBreeds());
		BreedMatcher.Match match = BreedMatcher.match(breed, bannedBreeds);
		CityPetPolicyResponses.Match responseMatch = match == null ? null
				: new CityPetPolicyResponses.Match(match.breed(), match.matched());
		CityPetPolicyResponses.Source source = new CityPetPolicyResponses.Source(policy.getSourceTitle(),
				policy.getSourceNote());
		return new CityPetPolicyResponses.PetPolicy(adcode, name, true, policy.getAreaScope(), policies, bannedBreeds,
				source, policy.getUpdatedMonth(), responseMatch);
	}

	private static List<String> parseStringArray(String json) {
		JsonNode node = JSON.readTree(json);
		List<String> values = new ArrayList<>();
		node.forEach((item) -> values.add(item.asString()));
		return values;
	}

}
