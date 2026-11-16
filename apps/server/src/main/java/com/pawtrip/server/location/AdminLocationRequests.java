package com.pawtrip.server.location;

import java.math.BigDecimal;

public final class AdminLocationRequests {

	private AdminLocationRequests() {
	}

	public record SaveLocation(String poiId, String typeGroup, Integer minVisitHours, Integer maxVisitHours,
			PetPolicies petPolicies) {
	}

	public record UpdateLocation(Integer minVisitHours, Integer maxVisitHours, PetPolicies petPolicies) {
	}

	public record PetPolicies(BigDecimal maxPetsPerPerson, Double maxSinglePetWeightKg, Boolean leashRequired,
			Boolean vaccinationProofRequired, BigDecimal extraFeeCents, Boolean reservationRequired) {
	}
}
