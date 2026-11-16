package com.pawtrip.server.pet;

public final class PetRequests {

	private PetRequests() {
	}

	public record SavePet(String name, String petType, Double weightKg, Double shoulderHeightCm, Boolean hasLeash,
			Boolean hasVaccinationProof, String photo) {
	}

}
