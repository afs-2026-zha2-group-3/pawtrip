package com.pawtrip.server.destination;

import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
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
			@RequestParam(defaultValue = "false") boolean petFriendly) {
		String trimmedKeyword = keyword == null ? "" : keyword.trim();
		return this.regionRepository.findAllByLevelOrderByNameAsc("city").stream()
				.filter(region -> !petFriendly || isPetFriendly(region))
				.map(this::toResponse)
				.filter(candidate -> matchesKeyword(candidate, trimmedKeyword))
				.toList();
	}

	// 宠物友好：未设每人限养数（null）或允许至少 1 只；限养 0 只视为不友好
	private static boolean isPetFriendly(AdministrativeRegion region) {
		Integer maxPetsPerPerson = region.getMaxPetsPerPerson();
		return maxPetsPerPerson == null || maxPetsPerPerson >= 1;
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
		// TODO: 政策收录状态与禁养犬种列表——数据来源确定后补充，当前占位为未收录/空列表
		return new DestinationResponse(region.getAdcode(), region.getName(), province, false, List.of());
	}

	record DestinationResponse(String adcode, String name, String province, boolean policyCovered,
			List<BannedBreedResponse> bannedBreeds) {
	}

	record BannedBreedResponse(String breedName, String source, String updated) {
	}

}