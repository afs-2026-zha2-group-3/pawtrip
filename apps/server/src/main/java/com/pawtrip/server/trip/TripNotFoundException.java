package com.pawtrip.server.trip;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

public class TripNotFoundException extends ApiException {

	public TripNotFoundException() {
		super(ApiErrorCode.TRIP_NOT_FOUND, "Trip was not found");
	}

}
