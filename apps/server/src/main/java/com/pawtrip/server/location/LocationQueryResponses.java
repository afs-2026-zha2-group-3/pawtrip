package com.pawtrip.server.location;

import java.util.List;

final class LocationQueryResponses {

	private LocationQueryResponses() {
	}

	record Page<T>(int page, int pageSize, long totalElements, int totalPages, boolean hasNext,
			boolean hasPrevious, List<T> items) {

		Page {
			items = List.copyOf(items);
		}
	}

	record AttractionSummary(String poiId, String name, String typeCode, String typeGroup, String address,
			String regionCode, Integer maxPetsPerPerson, PetPolicies petPolicies) {

		static AttractionSummary from(PawtripLocation location) {
			return new AttractionSummary(
					location.getPoiId(),
					location.getName(),
					location.getTypeCode(),
					location.getTypeGroup(),
					location.getAddress(),
					location.getRegionCode(),
					location.getMaxPetsPerPerson(),
					PetPolicies.from(location));
		}
	}

	record PetPolicies(String allowedPetTypes, Integer maxPetsPerPerson, Double maxSinglePetWeightKg,
			Double maxSinglePetShoulderHeightCm, Boolean leashRequired, Boolean vaccinationProofRequired,
			Long extraFeeCents, Boolean reservationRequired) {

		static PetPolicies from(PawtripLocation location) {
			return new PetPolicies(
					location.getAllowedPetTypes(),
					location.getMaxPetsPerPerson(),
					location.getMaxSinglePetWeightKg(),
					location.getMaxSinglePetShoulderHeightCm(),
					location.getLeashRequired(),
					location.getVaccinationProofRequired(),
					location.getExtraFeeCents(),
					location.getReservationRequired());
		}
	}

	record LocationDetail(String poiId, String name, String typeCode, String typeGroup, String address,
			String regionCode, PetPolicies petPolicies) {

		static LocationDetail from(PawtripLocation location) {
			return new LocationDetail(
					location.getPoiId(),
					location.getName(),
					location.getTypeCode(),
					location.getTypeGroup(),
					location.getAddress(),
					location.getRegionCode(),
					PetPolicies.from(location));
		}
	}

}
