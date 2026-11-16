package com.pawtrip.server.destination;

import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class DestinationController {

	private final AdministrativeRegionRepository regionRepository;

	private final RegionBannedBreedRepository bannedBreedRepository;

	DestinationController(AdministrativeRegionRepository regionRepository,
			RegionBannedBreedRepository bannedBreedRepository) {
		this.regionRepository = regionRepository;
		this.bannedBreedRepository = bannedBreedRepository;
	}

	@GetMapping("/api/destinations")
	List<DestinationResponse> destinations() {
		return this.regionRepository.findAllByPolicyCoveredTrueOrderByAdcodeAsc().stream()
				.map(this::toResponse)
				.toList();
	}

	private DestinationResponse toResponse(AdministrativeRegion region) {
		String province = this.regionRepository.findById(region.getParentAdcode())
				.map(AdministrativeRegion::getName)
				.orElse(null);
		List<BannedBreedResponse> bannedBreeds = this.bannedBreedRepository
				.findAllByRegionAdcodeOrderByIdAsc(region.getAdcode())
				.stream()
				.map(breed -> new BannedBreedResponse(breed.getBreedName(), breed.getSource(), breed.getUpdated()))
				.toList();
		return new DestinationResponse(region.getAdcode(), region.getName(), province, region.isPolicyCovered(),
				bannedBreeds);
	}

	record DestinationResponse(String adcode, String name, String province, boolean policyCovered,
			List<BannedBreedResponse> bannedBreeds) {
	}

	record BannedBreedResponse(String breedName, String source, String updated) {
	}

}