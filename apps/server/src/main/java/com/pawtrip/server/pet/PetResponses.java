package com.pawtrip.server.pet;

import java.util.Base64;

public final class PetResponses {

	private PetResponses() {
	}

	public record PetDetail(Long id, String name, PetType petType, Double weightKg, Double shoulderHeightCm,
			boolean hasLeash, boolean hasVaccinationProof, String photo) {

		static PetDetail from(Pet pet) {
			byte[] photo = pet.getPhoto();
			return new PetDetail(
					pet.getId(),
					pet.getName(),
					pet.getPetType(),
					pet.getWeightKg(),
					pet.getShoulderHeightCm(),
					pet.hasLeash(),
					pet.hasVaccinationProof(),
					photo == null ? null : Base64.getEncoder().encodeToString(photo));
		}
	}

	public record DogBreedDetail(Long id, String name, boolean officialAggressive) {

		static DogBreedDetail from(DogBreed dogBreed) {
			return new DogBreedDetail(
					dogBreed.getId(),
					dogBreed.getName(),
					dogBreed.isOfficialAggressive());
		}
	}

}
