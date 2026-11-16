package com.pawtrip.server.location;

import java.util.List;

import com.pawtrip.server.pet.DogBreed;

public final class AdminCityResponses {

	private AdminCityResponses() {
	}

	public record BreedOption(Long id, String name, boolean officialAggressive) {

		static BreedOption from(DogBreed breed) {
			return new BreedOption(breed.getId(), breed.getName(), breed.isOfficialAggressive());
		}
	}

	public record AllowedBreeds(String adcode, String name, List<Long> allowedBreedIds, List<BreedOption> breeds) {

		public AllowedBreeds {
			allowedBreedIds = List.copyOf(allowedBreedIds);
			breeds = List.copyOf(breeds);
		}
	}

}
