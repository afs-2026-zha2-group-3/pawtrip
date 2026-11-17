package com.pawtrip.server.application.model.maps;

import java.math.BigDecimal;

public record RouteEstimateRequest(Endpoint origin, Endpoint destination, Mode mode) {

	public enum Mode {
		WALK,
		DRIVE
	}

	public record Endpoint(String poiId, BigDecimal longitude, BigDecimal latitude) {}
}