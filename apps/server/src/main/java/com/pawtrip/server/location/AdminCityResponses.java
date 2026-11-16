package com.pawtrip.server.location;

import java.util.List;

public final class AdminCityResponses {

	private AdminCityResponses() {
	}

	public record CityListItem(String adcode, String name, String level, String provinceAdcode,
			String provinceName, AdminLocationResponses.PetPolicies petPolicies) {
	}

	public record CityDetail(String adcode, String name, String level, String provinceAdcode, String provinceName,
			AdminLocationResponses.PetPolicies petPolicies, List<Long> allowedDogBreedIds) {

		public CityDetail {
			allowedDogBreedIds = List.copyOf(allowedDogBreedIds);
		}
	}
}
