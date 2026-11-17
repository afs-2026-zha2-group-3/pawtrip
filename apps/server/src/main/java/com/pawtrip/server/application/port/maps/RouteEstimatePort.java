package com.pawtrip.server.application.port.maps;

import com.pawtrip.server.application.model.maps.RouteEstimateRequest;
import com.pawtrip.server.application.model.maps.RouteEstimateResult;

public interface RouteEstimatePort {

	RouteEstimateResult estimate(RouteEstimateRequest request);
}