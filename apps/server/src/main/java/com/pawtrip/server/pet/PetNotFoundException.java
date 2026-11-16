package com.pawtrip.server.pet;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

public class PetNotFoundException extends ApiException {

	public PetNotFoundException() {
		super(ApiErrorCode.PET_NOT_FOUND, "Pet was not found");
	}

}
