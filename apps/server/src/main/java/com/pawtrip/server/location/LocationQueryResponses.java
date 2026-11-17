package com.pawtrip.server.location;

import java.util.List;

final class LocationQueryResponses {

	private LocationQueryResponses() {
	}

	record LocationTypeOption(String key, String label, List<String> typeCodes) {

		LocationTypeOption {
			typeCodes = List.copyOf(typeCodes);
		}
	}

	record Page<T>(int page, int pageSize, long totalElements, int totalPages, boolean hasNext,
			boolean hasPrevious, List<T> items) {

		Page {
			items = List.copyOf(items);
		}
	}

	record LocationSummary(String poiId, String name, String typeCode, String typeGroup, String address,
			Double longitude, Double latitude, String regionCode, Integer minVisitHours, Integer maxVisitHours,
			Integer maxPetsPerPerson, PetPolicies petPolicies, String coverPhotoUrl, String rating,
			Long distanceMeters) {

		static LocationSummary from(PawtripLocation location, String coverPhotoUrl, String rating,
				Long distanceMeters) {
			return new LocationSummary(
					location.getPoiId(),
					location.getName(),
					location.getTypeCode(),
					location.getTypeGroup(),
					location.getAddress(),
					location.getLongitude(),
					location.getLatitude(),
					location.getRegionCode(),
					location.getMinVisitHours(),
					location.getMaxVisitHours(),
					location.getMaxPetsPerPerson(),
					PetPolicies.from(location),
					coverPhotoUrl,
					rating,
					distanceMeters);
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

	record NearbyServices(NearbyService hospital, NearbyService supplies) {
	}

	record NearbyService(String poiId, String name, String address, Long distanceMeters,
			String openingHours) {
	}

	record LocationDetail(String poiId, String name, String typeCode, String typeGroup, String address,
			String regionCode, PetPolicies petPolicies, String coverPhotoUrl, String rating, String keytag,
			String businessArea) {

		static LocationDetail from(PawtripLocation location, String coverPhotoUrl, String rating, String keytag,
				String businessArea) {
			return new LocationDetail(
					location.getPoiId(),
					location.getName(),
					location.getTypeCode(),
					location.getTypeGroup(),
					location.getAddress(),
					location.getRegionCode(),
					PetPolicies.from(location),
					coverPhotoUrl,
					rating,
					keytag,
					businessArea);
		}
	}

}
