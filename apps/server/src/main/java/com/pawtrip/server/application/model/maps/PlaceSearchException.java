package com.pawtrip.server.application.model.maps;

public class PlaceSearchException extends RuntimeException {

	private final Code code;

	public PlaceSearchException(Code code, String message) {
		super(message);
		this.code = code;
	}

	public Code code() {
		return code;
	}

	public enum Code {
		INVALID_ARGUMENT,
		MISSING_CONFIGURATION,
		UPSTREAM_FAILURE
	}
}
