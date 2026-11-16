package com.pawtrip.server.pet;

import java.util.Base64;
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
				dogBreedId(pet.dogBreed())));
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
				dogBreedId(pet.dogBreed()));
		return PetResponses.PetDetail.from(this.petRepository.save(existing), pet.dogBreed());
	}

	@Transactional
	void delete(String username, long petId) {
		this.petRepository.delete(findOwnedPet(userId(username), petId));
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
				resolveBreed(petType, request.dogBreedId()));
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
			boolean hasLeash, boolean hasVaccinationProof, byte[] photo, DogBreed dogBreed) {
	}

}
