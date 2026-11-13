package com.pawtrip.server.error;

public class UnauthenticatedException extends ApiException {

	public UnauthenticatedException() {
		super(ApiErrorCode.UNAUTHENTICATED, "Authentication required");
	}

}
