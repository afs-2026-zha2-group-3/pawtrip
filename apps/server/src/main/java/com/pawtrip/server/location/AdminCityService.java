package com.pawtrip.server.location;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.pet.DogBreed;
import com.pawtrip.server.pet.DogBreedRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class AdminCityService {

	private static final int DEFAULT_PAGE = 1;
	private static final int DEFAULT_PAGE_SIZE = 10;
	private static final int MAX_PAGE_SIZE = 100;
	private static final String CITY_LEVEL = "city";
	private static final String PROVINCE_LEVEL = "province";

	private final AdministrativeRegionRepository regionRepository;
	private final DogBreedRepository dogBreedRepository;

	AdminCityService(AdministrativeRegionRepository regionRepository, DogBreedRepository dogBreedRepository) {
		this.regionRepository = regionRepository;
		this.dogBreedRepository = dogBreedRepository;
	}

	AdminLocationResponses.Page<AdminCityResponses.CityListItem> cities(String provinceAdcode, String level,
			String keyword, Integer requestedPage, Integer requestedPageSize) {
		PageParameters page = validatePage(requestedPage, requestedPageSize);
		String normalizedLevel = validateLevel(level);
		String normalizedKeyword = keyword == null ? "" : keyword.trim();

		List<AdministrativeRegion> regions = this.regionRepository.findAllByOrderByNameAsc();
		Map<String, AdministrativeRegion> regionsByAdcode = regions.stream()
				.collect(Collectors.toMap(
						AdministrativeRegion::getAdcode,
						region -> region,
						(left, right) -> left,
						LinkedHashMap::new));
		Set<String> provinceAdcodesWithChildren = regions.stream()
				.map(AdministrativeRegion::getParentAdcode)
				.filter(Objects::nonNull)
				.collect(Collectors.toSet());
		AdministrativeRegion provinceFilter = validateProvinceFilter(provinceAdcode, regionsByAdcode);

		List<AdminCityResponses.CityListItem> items = new ArrayList<>();
		for (AdministrativeRegion region : regions) {
			if (!isEditable(region, provinceAdcodesWithChildren)) {
				continue;
			}
			if (normalizedLevel != null && !normalizedLevel.equals(region.getLevel())) {
				continue;
			}
			String provinceCode = provinceCode(region);
			if (provinceFilter != null && !provinceFilter.getAdcode().equals(provinceCode)) {
				continue;
			}
			if (!normalizedKeyword.isEmpty() && !region.getName().contains(normalizedKeyword)) {
				continue;
			}
			items.add(new AdminCityResponses.CityListItem(
					region.getAdcode(),
					region.getName(),
					region.getLevel(),
					provinceCode,
					provinceName(region, regionsByAdcode),
					AdminLocationResponses.PetPolicies.from(region)));
		}

		int totalElements = items.size();
		int totalPages = (totalElements + page.pageSize() - 1) / page.pageSize();
		int from = Math.min((page.page() - 1) * page.pageSize(), totalElements);
		int to = Math.min(from + page.pageSize(), totalElements);
		return new AdminLocationResponses.Page<>(
				page.page(),
				page.pageSize(),
				totalElements,
				totalPages,
				to < totalElements,
				page.page() > 1,
				items.subList(from, to));
	}

	@Transactional(readOnly = true)
	AdminCityResponses.CityDetail cityDetail(String requestedAdcode) {
		return toCityDetail(findEditableRegion(requestedAdcode));
	}

	@Transactional
	AdminCityResponses.CityDetail updateCity(String requestedAdcode, AdminCityRequests.UpdateCity request) {
		if (request == null) {
			throw invalidQuery();
		}
		AdministrativeRegion region = findEditableRegion(requestedAdcode);
		PetPolicyRules.validate(request.petPolicies());
		List<DogBreed> allowedDogBreeds = resolveAllowedDogBreeds(request.allowedDogBreedIds());

		LocationWriteService.PetPolicyValues policies = PetPolicyRules.toValues(request.petPolicies());
		if (policies != null) {
			region.updatePetPolicies(
					policies.allowedPetTypes(),
					policies.maxPetsPerPerson(),
					policies.maxSinglePetWeightKg(),
					policies.maxSinglePetShoulderHeightCm(),
					policies.leashRequired(),
					policies.vaccinationProofRequired(),
					policies.extraFeeCents(),
					policies.reservationRequired());
		}
		if (allowedDogBreeds != null) {
			region.updateAllowedDogBreeds(allowedDogBreeds);
		}
		return toCityDetail(this.regionRepository.save(region));
	}

	private List<DogBreed> resolveAllowedDogBreeds(List<Long> requestedDogBreedIds) {
		if (requestedDogBreedIds == null) {
			return null;
		}
		if (requestedDogBreedIds.stream().anyMatch(Objects::isNull)) {
			throw invalidQuery();
		}
		List<Long> distinctIds = requestedDogBreedIds.stream().distinct().toList();
		if (distinctIds.isEmpty()) {
			return List.of();
		}
		List<DogBreed> breeds = this.dogBreedRepository.findAllById(distinctIds);
		if (breeds.size() != distinctIds.size()) {
			throw invalidQuery();
		}
		breeds.sort(Comparator.comparing(DogBreed::getId));
		return breeds;
	}

	private AdministrativeRegion findEditableRegion(String requestedAdcode) {
		String adcode = validateAdcode(requestedAdcode);
		AdministrativeRegion region = this.regionRepository.findById(adcode)
				.orElseThrow(() -> new ApiException(ApiErrorCode.REGION_NOT_FOUND, "Region was not found"));
		if (!isEditable(region)) {
			throw invalidQuery();
		}
		return region;
	}

	private boolean isEditable(AdministrativeRegion region) {
		if (CITY_LEVEL.equals(region.getLevel())) {
			return true;
		}
		return PROVINCE_LEVEL.equals(region.getLevel())
				&& !this.regionRepository.existsByParentAdcode(region.getAdcode());
	}

	private static boolean isEditable(AdministrativeRegion region, Set<String> provinceAdcodesWithChildren) {
		if (CITY_LEVEL.equals(region.getLevel())) {
			return true;
		}
		return PROVINCE_LEVEL.equals(region.getLevel())
				&& !provinceAdcodesWithChildren.contains(region.getAdcode());
	}

	private AdminCityResponses.CityDetail toCityDetail(AdministrativeRegion region) {
		String provinceName = region.getParentAdcode() == null
				? region.getName()
				: this.regionRepository.findById(region.getParentAdcode())
						.map(AdministrativeRegion::getName)
						.orElse(null);
		List<Long> allowedDogBreedIds = region.getAllowedDogBreeds().stream()
				.map(DogBreed::getId)
				.toList();
		return new AdminCityResponses.CityDetail(
				region.getAdcode(),
				region.getName(),
				region.getLevel(),
				provinceCode(region),
				provinceName,
				AdminLocationResponses.PetPolicies.from(region),
				allowedDogBreedIds);
	}

	private static String provinceCode(AdministrativeRegion region) {
		return region.getParentAdcode() == null ? region.getAdcode() : region.getParentAdcode();
	}

	private static String provinceName(AdministrativeRegion region,
			Map<String, AdministrativeRegion> regionsByAdcode) {
		if (region.getParentAdcode() == null) {
			return region.getName();
		}
		return regionsByAdcode.getOrDefault(region.getParentAdcode(), region).getName();
	}

	private static AdministrativeRegion validateProvinceFilter(String provinceAdcode,
			Map<String, AdministrativeRegion> regionsByAdcode) {
		if (provinceAdcode == null) {
			return null;
		}
		if (!provinceAdcode.matches("\\d{6}")) {
			throw invalidQuery();
		}
		AdministrativeRegion region = regionsByAdcode.get(provinceAdcode);
		if (region == null || !PROVINCE_LEVEL.equals(region.getLevel())) {
			throw invalidQuery();
		}
		return region;
	}

	private static String validateLevel(String level) {
		if (level == null || level.isBlank()) {
			return null;
		}
		if (!CITY_LEVEL.equals(level) && !PROVINCE_LEVEL.equals(level)) {
			throw invalidQuery();
		}
		return level;
	}

	private static String validateAdcode(String adcode) {
		if (adcode == null || !adcode.matches("\\d{6}")) {
			throw invalidQuery();
		}
		return adcode;
	}

	private static PageParameters validatePage(Integer requestedPage, Integer requestedPageSize) {
		int page = requestedPage == null ? DEFAULT_PAGE : requestedPage;
		int pageSize = requestedPageSize == null ? DEFAULT_PAGE_SIZE : requestedPageSize;
		if (page < 1 || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
			throw invalidQuery();
		}
		return new PageParameters(page, pageSize);
	}

	private static ApiException invalidQuery() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid city query");
	}

	private record PageParameters(int page, int pageSize) {
	}
}
