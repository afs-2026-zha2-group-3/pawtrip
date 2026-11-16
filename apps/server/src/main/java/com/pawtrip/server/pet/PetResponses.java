package com.pawtrip.server.pet;

public final class PetResponses {

	private PetResponses() {
	}

	public record PetDetail(Long id, String name, PetType petType, Double weightKg, Double shoulderHeightCm,
			boolean hasLeash, boolean hasVaccinationProof) {

		static PetDetail from(Pet pet) {
			return new PetDetail(
					pet.getId(),
					pet.getName(),
					pet.getPetType(),
					pet.getWeightKg(),
					pet.getShoulderHeightCm(),
					pet.hasLeash(),
					pet.hasVaccinationProof());
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
