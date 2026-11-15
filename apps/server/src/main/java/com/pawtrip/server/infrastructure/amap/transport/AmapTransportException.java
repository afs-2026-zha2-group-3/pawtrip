package com.pawtrip.server.infrastructure.amap.transport;

public class AmapTransportException extends RuntimeException {

	private final Code code;

	public AmapTransportException(Code code) {
		super(switch (code) {
			case MISSING_API_KEY -> "AMAP_API_KEY is not configured";
			case UPSTREAM_FAILURE -> "AMap request failed";
		});
		this.code = code;
	}

	public Code code() {
		return code;
	}

	public enum Code {
		MISSING_API_KEY,
		UPSTREAM_FAILURE
	}
}
