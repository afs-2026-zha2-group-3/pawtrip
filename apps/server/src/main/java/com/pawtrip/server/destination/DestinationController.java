package com.pawtrip.server.destination;

import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
import com.pawtrip.server.pet.DogBreed;
import com.pawtrip.server.pet.PetType;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
class DestinationController {

	private final AdministrativeRegionRepository regionRepository;

	DestinationController(AdministrativeRegionRepository regionRepository) {
		this.regionRepository = regionRepository;
	}

	@GetMapping("/api/destinations")
	List<DestinationResponse> destinations(@RequestParam(required = false) String keyword,
			@RequestParam(defaultValue = "false") boolean petFriendly,
			@RequestParam(required = false) PetType petType,
			@RequestParam(required = false) Long breedId,
			@RequestParam(required = false) Double shoulderHeightCm) {
		String trimmedKeyword = keyword == null ? "" : keyword.trim();
		return this.regionRepository.findByLevelOrderByNameAsc("city").stream()
				.filter(region -> !petFriendly || isPetFriendly(region, petType, breedId, shoulderHeightCm))
				.map(this::toResponse)
				.filter(candidate -> matchesKeyword(candidate, trimmedKeyword))
				.toList();
	}

	// 宠物友好：限养数（null 或 >=1）且类型允许且品种允许且肩高允许；
	// 类型 null=不允许（需求方 2026-11-16 修订）；品种空列表/肩高 null=未配置放行；
	// 肩高为犬类口径，仅 DOG 参与筛选
	private static boolean isPetFriendly(AdministrativeRegion region, PetType petType, Long breedId,
			Double shoulderHeightCm) {
		Integer maxPetsPerPerson = region.getMaxPetsPerPerson();
		if (maxPetsPerPerson != null && maxPetsPerPerson < 1) {
			return false;
		}
		if (petType != null && !allowsPetType(region, petType)) {
			return false;
		}
		if (petType == PetType.DOG && breedId != null && !allowsDogBreed(region, breedId)) {
			return false;
		}
		if (petType == PetType.DOG && shoulderHeightCm != null
				&& !allowsShoulderHeight(region, shoulderHeightCm)) {
			return false;
		}
		return true;
	}

	private static boolean allowsPetType(AdministrativeRegion region, PetType petType) {
		String allowedPetTypes = region.getAllowedPetTypes();
		return allowedPetTypes != null && allowedPetTypes.contains(petType.name());
	}

	private static boolean allowsDogBreed(AdministrativeRegion region, Long breedId) {
		List<DogBreed> allowedDogBreeds = region.getAllowedDogBreeds();
		return allowedDogBreeds.isEmpty()
				|| allowedDogBreeds.stream().anyMatch(breed -> breedId.equals(breed.getId()));
	}

	private static boolean allowsShoulderHeight(AdministrativeRegion region, double shoulderHeightCm) {
		Double maxShoulderHeight = region.getMaxSinglePetShoulderHeightCm();
		return maxShoulderHeight == null || shoulderHeightCm <= maxShoulderHeight;
	}

	private static boolean matchesKeyword(DestinationResponse candidate, String trimmedKeyword) {
		if (trimmedKeyword.isEmpty()) {
			return true;
		}
		return candidate.name().contains(trimmedKeyword)
				|| (candidate.province() != null && candidate.province().contains(trimmedKeyword));
	}

	private DestinationResponse toResponse(AdministrativeRegion region) {
		String province = this.regionRepository.findById(region.getParentAdcode())
				.map(AdministrativeRegion::getName)
				.orElse(null);
		List<Long> allowedDogBreedIds = region.getAllowedDogBreeds().stream()
				.map(DogBreed::getId)
				.toList();
		// TODO: 政策收录状态与禁养犬种列表——数据来源确定后补充，当前占位为未收录/空列表
		return new DestinationResponse(region.getAdcode(), region.getName(), province, false, List.of(),
				region.getAllowedPetTypes(), allowedDogBreedIds, region.getMaxSinglePetShoulderHeightCm(),
				parseFeatureTags(region.getFeatureTags()));
	}

	// REQ-014：逗号分隔存储 → trim/去空段/去重（保留首次出现顺序），NULL/空白 → 空数组
	private static List<String> parseFeatureTags(String featureTags) {
		if (featureTags == null || featureTags.isBlank()) {
			return List.of();
		}
		List<String> keys = new java.util.ArrayList<>();
		for (String segment : featureTags.split(",")) {
			String key = segment.trim();
			if (!key.isEmpty() && !keys.contains(key)) {
				keys.add(key);
			}
		}
		return List.copyOf(keys);
	}

	record DestinationResponse(String adcode, String name, String province, boolean policyCovered,
			List<BannedBreedResponse> bannedBreeds, String allowedPetTypes, List<Long> allowedDogBreedIds,
			Double maxSinglePetShoulderHeightCm, List<String> featureTags) {
	}

	record BannedBreedResponse(String breedName, String source, String updated) {
	}

}