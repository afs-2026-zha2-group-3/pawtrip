package com.pawtrip.server.location;

import java.util.Comparator;
import java.util.List;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.pet.DogBreed;
import com.pawtrip.server.pet.DogBreedRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AdminCityService {

	private final AdministrativeRegionRepository regionRepository;

	private final DogBreedRepository dogBreedRepository;

	AdminCityService(AdministrativeRegionRepository regionRepository, DogBreedRepository dogBreedRepository) {
		this.regionRepository = regionRepository;
		this.dogBreedRepository = dogBreedRepository;
	}

	@Transactional(readOnly = true)
	AdminCityResponses.AllowedBreeds allowedBreeds(String adcode) {
		return response(findCity(adcode));
	}

	@Transactional
	AdminCityResponses.AllowedBreeds updateAllowedBreeds(String adcode,
			AdminCityRequests.UpdateAllowedBreeds request) {
		AdministrativeRegion region = findCity(adcode);
		List<Long> breedIds = request == null || request.breedIds() == null ? List.of()
				: request.breedIds().stream().distinct().toList();
		List<DogBreed> breeds = this.dogBreedRepository.findAllById(breedIds)
			.stream()
			.sorted(Comparator.comparing(DogBreed::getId))
			.toList();
		if (breeds.size() != breedIds.size()) {
			throw new ApiException(ApiErrorCode.VALIDATION_ERROR, "Unknown dog breed");
		}
		region.updateAllowedDogBreeds(breeds);
		return response(this.regionRepository.saveAndFlush(region));
	}

	private AdministrativeRegion findCity(String adcode) {
		AdministrativeRegion region = this.regionRepository.findById(adcode)
			.orElseThrow(() -> new ApiException(ApiErrorCode.CITY_NOT_FOUND, "City was not found"));
		if (!"city".equals(region.getLevel())) {
			throw new ApiException(ApiErrorCode.CITY_NOT_FOUND, "City was not found");
		}
		return region;
	}

	private AdminCityResponses.AllowedBreeds response(AdministrativeRegion region) {
		List<Long> allowedBreedIds = region.getAllowedDogBreeds()
			.stream()
			.map((breed) -> breed.getId())
			.toList();
		List<AdminCityResponses.BreedOption> breeds = this.dogBreedRepository.findAllByOrderByNameAsc()
			.stream()
			.map(AdminCityResponses.BreedOption::from)
			.toList();
		return new AdminCityResponses.AllowedBreeds(region.getAdcode(), region.getName(), allowedBreedIds, breeds);
	}

}
