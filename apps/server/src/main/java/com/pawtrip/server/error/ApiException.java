package com.pawtrip.server.error;

public class ApiException extends RuntimeException {

	private final ApiErrorCode code;

	public ApiException(ApiErrorCode code, String detail) {
		super(detail);
		this.code = code;
	}

	public ApiException(ApiErrorCode code, String detail, Throwable cause) {
		super(detail, cause);
		this.code = code;
	}

	public ApiErrorCode getCode() {
		return this.code;
	}

}
