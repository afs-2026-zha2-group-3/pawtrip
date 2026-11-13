package com.pawtrip.server.error;

import static org.assertj.core.api.Assertions.assertThat;

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

}
