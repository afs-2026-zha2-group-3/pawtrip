package com.pawtrip.server.pet;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

public class PetInUseException extends ApiException {

	public PetInUseException(Throwable cause) {
		super(ApiErrorCode.PET_IN_USE, "Pet is referenced by a trip", cause);
	}

}
