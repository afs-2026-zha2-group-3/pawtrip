package com.pawtrip.server.location;

import java.math.BigDecimal;
import java.util.Set;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

final class PetPolicyRules {

	private static final Set<String> ALLOWED_PET_TYPES = Set.of("CAT", "DOG", "CAT,DOG");

	private PetPolicyRules() {
	}

	static void validate(AdminLocationRequests.PetPolicies petPolicies) {
		if (petPolicies == null) {
			return;
		}
		String allowedPetTypes = petPolicies.allowedPetTypes();
		if (allowedPetTypes != null && !ALLOWED_PET_TYPES.contains(allowedPetTypes)) {
			throw invalidQuery();
		}
		validateNonNegativeInteger(petPolicies.maxPetsPerPerson(), true);
		validateNonNegativeDecimal(petPolicies.maxSinglePetWeightKg());
		validateNonNegativeDecimal(petPolicies.maxSinglePetShoulderHeightCm());
		validateNonNegativeInteger(petPolicies.extraFeeCents(), false);
	}

	static LocationWriteService.PetPolicyValues toValues(AdminLocationRequests.PetPolicies petPolicies) {
		if (petPolicies == null) {
			return null;
		}
		return new LocationWriteService.PetPolicyValues(
				petPolicies.allowedPetTypes(),
				petPolicies.maxPetsPerPerson() == null ? null : petPolicies.maxPetsPerPerson().intValueExact(),
				petPolicies.maxSinglePetWeightKg(),
				petPolicies.maxSinglePetShoulderHeightCm(),
				petPolicies.leashRequired(),
				petPolicies.vaccinationProofRequired(),
				petPolicies.extraFeeCents() == null ? null : petPolicies.extraFeeCents().longValueExact(),
				petPolicies.reservationRequired());
	}

	private static void validateNonNegativeDecimal(Double value) {
		if (value != null && (!Double.isFinite(value) || value < 0
				|| BigDecimal.valueOf(value).scale() > 2)) {
			throw invalidQuery();
		}
	}

	private static void validateNonNegativeInteger(BigDecimal value, boolean fitsInInt) {
		if (value == null) {
			return;
		}
		if (value.signum() < 0 || value.stripTrailingZeros().scale() > 0) {
			throw invalidQuery();
		}
		try {
			if (fitsInInt) {
				value.intValueExact();
			}
			else {
				value.longValueExact();
			}
		}
		catch (ArithmeticException exception) {
			throw invalidQuery();
		}
	}

	private static ApiException invalidQuery() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid pet policy");
	}
}
