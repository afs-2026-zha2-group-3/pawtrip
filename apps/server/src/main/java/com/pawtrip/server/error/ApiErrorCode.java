package com.pawtrip.server.error;

import org.springframework.http.HttpStatus;

public enum ApiErrorCode {

	GREETING_NOT_FOUND(HttpStatus.NOT_FOUND, "Greeting not found"),
	PLACE_NOT_FOUND(HttpStatus.NOT_FOUND, "Place not found"),
	LOCATION_NOT_FOUND(HttpStatus.NOT_FOUND, "Location not found"),
	LOCATION_CONFLICT(HttpStatus.CONFLICT, "Location conflict"),
	PET_NOT_FOUND(HttpStatus.NOT_FOUND, "Pet not found"),
	CITY_NOT_FOUND(HttpStatus.NOT_FOUND, "City not found"),

	VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Validation failed"),
	UPSTREAM_FAILURE(HttpStatus.BAD_GATEWAY, "Upstream service failure"),
	UNAUTHENTICATED(HttpStatus.UNAUTHORIZED, "Authentication required"),
	INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Invalid credentials"),
	ACCESS_DENIED(HttpStatus.FORBIDDEN, "Access denied"),
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
