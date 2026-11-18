package com.pawtrip.server.policy;

import java.util.ArrayList;
import java.util.List;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
import com.pawtrip.server.pet.DogBreedRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
class CityPetPolicyService {

	private static final JsonMapper JSON = JsonMapper.builder().build();

	private final CityPetPolicyRepository policyRepository;

	private final AdministrativeRegionRepository regionRepository;

	private final DogBreedRepository dogBreedRepository;

	CityPetPolicyService(CityPetPolicyRepository policyRepository, AdministrativeRegionRepository regionRepository,
			DogBreedRepository dogBreedRepository) {
		this.policyRepository = policyRepository;
		this.regionRepository = regionRepository;
		this.dogBreedRepository = dogBreedRepository;
	}

	@Transactional(readOnly = true)
	CityPetPolicyResponses.PetPolicy policyFor(String adcode, Long breedId) {
		AdministrativeRegion region = this.regionRepository.findById(adcode)
			.orElseThrow(() -> new ApiException(ApiErrorCode.CITY_NOT_FOUND, "City was not found"));

		return this.policyRepository.findById(adcode)
			.map((policy) -> coveredPolicy(adcode, region, policy, breedId))
			.orElseGet(() -> new CityPetPolicyResponses.PetPolicy(adcode, region.getName(), false, null, List.of(),
					List.of(), List.of(), region.getAllowedPetTypes(), null, null, null));
	}

	private CityPetPolicyResponses.PetPolicy coveredPolicy(String adcode, AdministrativeRegion region,
			CityPetPolicy policy, Long breedId) {
		List<String> policies = parseStringArray(policy.getPoliciesJson());
		List<String> bannedBreeds = policy.getBannedDogBreeds()
			.stream()
			.map((breed) -> breed.getName())
			.toList();
		List<String> allowedBreeds = region.getAllowedDogBreeds()
			.stream()
			.map((breed) -> breed.getName())
			.toList();
		List<Long> bannedBreedIds = policy.getBannedDogBreeds()
			.stream()
			.map((breed) -> breed.getId())
			.toList();
		List<Long> allowedBreedIds = region.getAllowedDogBreeds()
			.stream()
			.map((breed) -> breed.getId())
			.toList();
		CityPetPolicyResponses.Match match = match(breedId, bannedBreedIds, allowedBreedIds);
		CityPetPolicyResponses.Source source = new CityPetPolicyResponses.Source(policy.getSourceTitle(),
				policy.getSourceNote());
		return new CityPetPolicyResponses.PetPolicy(adcode, region.getName(), true, policy.getAreaScope(), policies,
				bannedBreeds, allowedBreeds, region.getAllowedPetTypes(), source, policy.getUpdatedMonth(), match);
	}

	private CityPetPolicyResponses.Match match(Long breedId, List<Long> bannedBreedIds, List<Long> allowedBreedIds) {
		if (breedId == null) {
			return null;
		}
		return this.dogBreedRepository.findById(breedId)
			.map((breed) -> {
				boolean banned = BreedMatcher.matches(breedId, bannedBreedIds);
				boolean allowed = BreedMatcher.matches(breedId, allowedBreedIds);
				if (!banned && !allowed) {
					return null;
				}
				return new CityPetPolicyResponses.Match(breed.getId(), breed.getName(), banned, allowed);
			})
			.orElse(null);
	}

	private static List<String> parseStringArray(String json) {
		JsonNode node = JSON.readTree(json);
		List<String> values = new ArrayList<>();
		node.forEach((item) -> values.add(item.asString()));
		return values;
	}

}
