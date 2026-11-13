package com.pawtrip.server.greeting;

import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;

public class GreetingNotFoundException extends ApiException {

	public GreetingNotFoundException() {
		super(ApiErrorCode.GREETING_NOT_FOUND, "No greeting configured");
	}

}
