package com.pawtrip.server.pet;

import java.util.List;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

public class PetInUseException extends ApiException {

	public PetInUseException(List<String> tripNames) {
		super(ApiErrorCode.PET_IN_USE, "Pet is referenced by trip(s): " + String.join(", ", tripNames));
	}

	public PetInUseException(Throwable cause) {
		super(ApiErrorCode.PET_IN_USE, "Pet is referenced by a trip", cause);
	}

}
