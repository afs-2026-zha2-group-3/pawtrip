package com.pawtrip.server.pet;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

public final class PetResponses {

	private PetResponses() {
	}

	public record PetDetail(Long id, String name, PetType petType, Double weightKg, Double shoulderHeightCm,
			boolean hasLeash, boolean hasVaccinationProof, String photo, DogBreedDetail dogBreed,
			List<String> preferences, String personality) {

		static PetDetail from(Pet pet, DogBreed dogBreed) {
			byte[] photo = pet.getPhoto();
			return new PetDetail(
					pet.getId(),
					pet.getName(),
					pet.getPetType(),
					pet.getWeightKg(),
					pet.getShoulderHeightCm(),
					pet.hasLeash(),
					pet.hasVaccinationProof(),
					photo == null ? null : Base64.getEncoder().encodeToString(photo),
					dogBreed == null ? null : DogBreedDetail.from(dogBreed),
					parseKeys(pet.getPreferences()),
					pet.getPersonality());
		}

		// 逗号分隔多键解析（design D2）：trim、忽略空段、去重；NULL/空串 → 空列表（未设置）
		private static List<String> parseKeys(String value) {
			if (value == null || value.isBlank()) {
				return List.of();
			}
			List<String> keys = new ArrayList<>();
			for (String segment : value.split(",")) {
				String key = segment.trim();
				if (!key.isEmpty() && !keys.contains(key)) {
					keys.add(key);
				}
			}
			return List.copyOf(keys);
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
