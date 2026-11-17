package com.pawtrip.server.pet;

import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.error.UnauthenticatedException;

import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class PetService {

	private static final int MAX_PHOTO_BYTES = 5 * 1024 * 1024;

	private final PetRepository petRepository;
	private final DogBreedRepository dogBreedRepository;
	private final AppUserRepository appUserRepository;

	PetService(PetRepository petRepository, DogBreedRepository dogBreedRepository,
			AppUserRepository appUserRepository) {
		this.petRepository = petRepository;
		this.dogBreedRepository = dogBreedRepository;
		this.appUserRepository = appUserRepository;
	}

	List<PetResponses.PetDetail> pets(String username) {
		Long userId = userId(username);
		List<Pet> pets = this.petRepository.findAllByUserIdOrderByIdAsc(userId);
		Map<Long, DogBreed> breeds = breedsById(pets);
		return pets.stream()
				.map(pet -> PetResponses.PetDetail.from(pet, breeds.get(pet.getDogBreedId())))
				.toList();
	}

	PetResponses.PetDetail pet(String username, long petId) {
		Pet pet = findOwnedPet(userId(username), petId);
		return PetResponses.PetDetail.from(pet, breedOf(pet));
	}

	@Transactional
	PetResponses.PetDetail create(String username, PetRequests.SavePet request) {
		ValidatedPet pet = validate(request);
		Pet saved = this.petRepository.save(new Pet(
				userId(username),
				pet.name(),
				pet.petType(),
				pet.weightKg(),
				pet.shoulderHeightCm(),
				pet.hasLeash(),
				pet.hasVaccinationProof(),
				pet.photo(),
				dogBreedId(pet.dogBreed()),
				pet.preferences(),
				pet.personality()));
		return PetResponses.PetDetail.from(saved, pet.dogBreed());
	}

	@Transactional
	PetResponses.PetDetail update(String username, long petId, PetRequests.SavePet request) {
		ValidatedPet pet = validate(request);
		Pet existing = findOwnedPet(userId(username), petId);
		existing.update(
				pet.name(),
				pet.petType(),
				pet.weightKg(),
				pet.shoulderHeightCm(),
				pet.hasLeash(),
				pet.hasVaccinationProof(),
				pet.photo(),
				dogBreedId(pet.dogBreed()),
				pet.preferences(),
				pet.personality());
		return PetResponses.PetDetail.from(this.petRepository.save(existing), pet.dogBreed());
	}

	@Transactional
	void delete(String username, long petId) {
		Pet pet = findOwnedPet(userId(username), petId);
		try {
			this.petRepository.delete(pet);
			this.petRepository.flush();
		}
		catch (DataAccessException exception) {
			if (isForeignKeyViolation(exception)) {
				throw new PetInUseException(exception);
			}
			throw exception;
		}
	}

	private static boolean isForeignKeyViolation(Throwable exception) {
		Throwable cause = exception;
		while (cause != null) {
			String message = cause.getMessage();
			if (message != null && message.contains("FOREIGN KEY constraint failed")) {
				return true;
			}
			cause = cause.getCause();
		}
		return false;
	}

	private Pet findOwnedPet(Long userId, long petId) {
		return this.petRepository.findByIdAndUserId(petId, userId)
				.orElseThrow(PetNotFoundException::new);
	}

	private Long userId(String username) {
		return this.appUserRepository.findByUsername(username)
				.orElseThrow(UnauthenticatedException::new)
				.getId();
	}

	private Map<Long, DogBreed> breedsById(List<Pet> pets) {
		Set<Long> breedIds = pets.stream()
				.map(Pet::getDogBreedId)
				.filter(Objects::nonNull)
				.collect(Collectors.toSet());
		return this.dogBreedRepository.findAllById(breedIds)
				.stream()
				.collect(Collectors.toMap(DogBreed::getId, Function.identity()));
	}

	private DogBreed breedOf(Pet pet) {
		return pet.getDogBreedId() == null ? null
				: this.dogBreedRepository.findById(pet.getDogBreedId()).orElse(null);
	}

	private ValidatedPet validate(PetRequests.SavePet request) {
		if (request == null) {
			throw invalidRequest();
		}
		String name = request.name() == null ? "" : request.name().trim();
		if (name.isEmpty()) {
			throw invalidRequest();
		}
		PetType petType = petType(request.petType());
		requirePositive(request.weightKg());
		requirePositive(request.shoulderHeightCm());
		if (request.hasLeash() == null || request.hasVaccinationProof() == null) {
			throw invalidRequest();
		}
		return new ValidatedPet(name, petType, request.weightKg(), request.shoulderHeightCm(),
				request.hasLeash(), request.hasVaccinationProof(), photo(request.photo()),
				resolveBreed(petType, request.dogBreedId()), preferences(request.preferences()),
				personality(request.personality()));
	}

	// 喜好键校验（design D4）：每键 ∈ PetPreference，非法 → 400；重复键去重后存储；null/空数组 → 未设置（NULL）
	private static String preferences(List<String> values) {
		if (values == null || values.isEmpty()) {
			return null;
		}
		LinkedHashSet<String> keys = new LinkedHashSet<>();
		for (String value : values) {
			if (value == null) {
				throw invalidRequest();
			}
			try {
				keys.add(PetPreference.valueOf(value).name());
			}
			catch (IllegalArgumentException exception) {
				throw invalidRequest();
			}
		}
		return String.join(",", keys);
	}

	// 性格键校验（design D4）：单键 ∈ PetPersonality，非法 → 400；null → 未设置
	private static String personality(String value) {
		if (value == null) {
			return null;
		}
		try {
			return PetPersonality.valueOf(value).name();
		}
		catch (IllegalArgumentException exception) {
			throw invalidRequest();
		}
	}

	private DogBreed resolveBreed(PetType petType, Long dogBreedId) {
		if (petType == PetType.DOG) {
			if (dogBreedId == null) {
				throw invalidRequest();
			}
			return this.dogBreedRepository.findById(dogBreedId)
					.orElseThrow(PetService::invalidRequest);
		}
		if (dogBreedId != null) {
			throw invalidRequest();
		}
		return null;
	}

	private static Long dogBreedId(DogBreed dogBreed) {
		return dogBreed == null ? null : dogBreed.getId();
	}

	private static byte[] photo(String value) {
		if (value == null) {
			return null;
		}
		if (value.isBlank()) {
			throw invalidRequest();
		}
		byte[] photo;
		try {
			photo = Base64.getDecoder().decode(value);
		}
		catch (IllegalArgumentException exception) {
			throw invalidRequest();
		}
		if (photo.length == 0 || photo.length > MAX_PHOTO_BYTES) {
			throw invalidRequest();
		}
		return photo;
	}

	private static PetType petType(String value) {
		if (value == null) {
			throw invalidRequest();
		}
		try {
			return PetType.valueOf(value);
		}
		catch (IllegalArgumentException exception) {
			throw invalidRequest();
		}
	}

	private static void requirePositive(Double value) {
		if (value == null || !Double.isFinite(value) || value <= 0) {
			throw invalidRequest();
		}
	}

	private static ApiException invalidRequest() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid pet request");
	}

	private record ValidatedPet(String name, PetType petType, Double weightKg, Double shoulderHeightCm,
			boolean hasLeash, boolean hasVaccinationProof, byte[] photo, DogBreed dogBreed,
			String preferences, String personality) {
	}

}
