package com.pawtrip.server.error;

import static org.assertj.core.api.Assertions.assertThat;

import com.pawtrip.server.application.model.maps.RouteEstimateException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class GlobalExceptionHandlerTest {

	private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

	@Test
	void mapsUnexpectedExceptionToInternalError() {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/greeting");

		ResponseEntity<ProblemDetail> response = this.handler
				.handleUnexpected(new RuntimeException("boom"), request);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().getStatus()).isEqualTo(500);
		assertThat(response.getBody().getDetail()).isEqualTo("An unexpected error occurred");
		assertThat(response.getBody().getProperties()).containsEntry("code", "INTERNAL_ERROR");
	}

	@Test
	void mapsRouteEstimateUpstreamFailureToBadGatewayWithoutLeakingUpstreamDetails() {
		MockHttpServletRequest request =
				new MockHttpServletRequest("GET", "/api/trips/trip-1/route-estimate");

		ResponseEntity<ProblemDetail> response = this.handler.handleRouteEstimateException(
				new RouteEstimateException(
						RouteEstimateException.Code.UPSTREAM_FAILURE, "secret-key raw-upstream-payload"),
				request);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().getStatus()).isEqualTo(502);
		assertThat(response.getBody().getDetail()).isEqualTo("Map service request failed");
		assertThat(response.getBody().getProperties()).containsEntry("code", "UPSTREAM_FAILURE");
		assertThat(response.getBody().getDetail()).doesNotContain("secret-key", "raw-upstream-payload");
	}

	@Test
	void mapsRouteEstimateMissingConfigurationToBadGatewayWithoutLeakingConfiguration() {
		MockHttpServletRequest request =
				new MockHttpServletRequest("GET", "/api/trips/trip-1/route-estimate");

		ResponseEntity<ProblemDetail> response = this.handler.handleRouteEstimateException(
				new RouteEstimateException(
						RouteEstimateException.Code.MISSING_CONFIGURATION, "AMAP_API_KEY is not configured"),
				request);

		assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
		assertThat(response.getBody()).isNotNull();
		assertThat(response.getBody().getProperties()).containsEntry("code", "UPSTREAM_FAILURE");
		assertThat(response.getBody().getDetail()).isEqualTo("Map service request failed");
		assertThat(response.getBody().getDetail()).doesNotContain("AMAP_API_KEY");
	}

}
