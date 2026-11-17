package com.pawtrip.server.application.model.maps;

public class RouteEstimateException extends RuntimeException {

	private final Code code;

	public RouteEstimateException(Code code, String message) {
		super(message);
		this.code = code;
	}

	public Code code() {
		return code;
	}

	public enum Code {
		MISSING_CONFIGURATION,
		UPSTREAM_FAILURE
	}
}