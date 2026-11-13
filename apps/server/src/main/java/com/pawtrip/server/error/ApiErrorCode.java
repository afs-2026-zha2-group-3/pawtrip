package com.pawtrip.server.error;

import org.springframework.http.HttpStatus;

public enum ApiErrorCode {

	GREETING_NOT_FOUND(HttpStatus.NOT_FOUND, "Greeting not found"),
	VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed"),
	INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error");

	private final HttpStatus status;
	private final String title;

	ApiErrorCode(HttpStatus status, String title) {
		this.status = status;
		this.title = title;
	}

	public HttpStatus getStatus() {
		return this.status;
	}

	public String getTitle() {
		return this.title;
	}

	public String getType() {
		return "https://pawtrip.local/errors/" + name().toLowerCase().replace('_', '-');
	}

}
