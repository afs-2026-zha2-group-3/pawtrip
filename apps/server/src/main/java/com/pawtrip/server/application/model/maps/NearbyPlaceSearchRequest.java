package com.pawtrip.server.application.model.maps;

import java.math.BigDecimal;

public record NearbyPlaceSearchRequest(
		BigDecimal longitude,
		BigDecimal latitude,
		String keywords,
		String types,
		Integer radius,
		Integer pageNum,
		Integer pageSize) {}
