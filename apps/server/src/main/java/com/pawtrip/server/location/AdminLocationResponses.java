package com.pawtrip.server.location;

import java.util.List;
import tools.jackson.databind.JsonNode;

public final class AdminLocationResponses {

	private AdminLocationResponses() {
	}

	public record RegionOption(String adcode, String name, String level, List<RegionOption> children) {

		public RegionOption {
			children = List.copyOf(children);
		}
	}


	public record Page<T>(int page, int pageSize, long totalElements, int totalPages, boolean hasNext,
			boolean hasPrevious, List<T> items) {

		public Page {
			items = List.copyOf(items);
		}
	}

	public record AmapCandidate(String poiId, String name, String typeCode, String address, String location,
			String regionCode, boolean saved, JsonNode poi) {

		public AmapCandidate {
			poi = poi.deepCopy();
		}

		@Override
		public JsonNode poi() {
			return this.poi.deepCopy();
		}
	}


	public record PetPolicies(String allowedPetTypes, Integer maxPetsPerPerson, Double maxSinglePetWeightKg,
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

		static PetPolicies from(AdministrativeRegion region) {
			return new PetPolicies(
					region.getAllowedPetTypes(),
					region.getMaxPetsPerPerson(),
					region.getMaxSinglePetWeightKg(),
					region.getMaxSinglePetShoulderHeightCm(),
					region.getLeashRequired(),
					region.getVaccinationProofRequired(),
					region.getExtraFeeCents(),
					region.getReservationRequired());
		}
	}

	public record LocationDetail(String poiId, String typeGroup, Integer minVisitHours, Integer maxVisitHours,
			PetPolicies petPolicies, JsonNode poi, JsonNode business, List<PhotoDetail> photos) {

		public LocationDetail {
			poi = poi.deepCopy();
			business = business.deepCopy();
			photos = List.copyOf(photos);
		}

		@Override
		public JsonNode poi() {
			return this.poi.deepCopy();
		}

		@Override
		public JsonNode business() {
			return this.business.deepCopy();
		}
	}

	public record PhotoDetail(Long photoId, Integer order, String title, String sourceUrl, JsonNode metadata) {

		public PhotoDetail {
			metadata = metadata.deepCopy();
		}

		@Override
		public JsonNode metadata() {
			return this.metadata.deepCopy();
		}
	}

}
