package com.pawtrip.server.error;

import com.pawtrip.server.application.model.maps.PlaceSearchException;
import com.pawtrip.server.application.model.maps.RouteEstimateException;
import java.net.URI;
import java.util.List;
import java.util.Map;

import jakarta.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	private static final URI VALIDATION_TYPE = URI.create("https://pawtrip.local/errors/validation-error");

	@ExceptionHandler(ApiException.class)
	ResponseEntity<ProblemDetail> handleApiException(ApiException exception, HttpServletRequest request) {
		ProblemDetail problem = problem(exception.getCode(), exception.getMessage(), request);
		return ResponseEntity.status(exception.getCode().getStatus())
				.contentType(MediaType.APPLICATION_PROBLEM_JSON)
				.body(problem);
	}

	@ExceptionHandler(PlaceSearchException.class)
	ResponseEntity<ProblemDetail> handlePlaceSearchException(PlaceSearchException exception,
			HttpServletRequest request) {
		ApiErrorCode code = switch (exception.code()) {
			case INVALID_ARGUMENT -> ApiErrorCode.VALIDATION_ERROR;
			case NOT_FOUND -> ApiErrorCode.PLACE_NOT_FOUND;
			case MISSING_CONFIGURATION, UPSTREAM_FAILURE -> ApiErrorCode.UPSTREAM_FAILURE;
		};
		String detail = switch (exception.code()) {
			case INVALID_ARGUMENT -> "Invalid place search request";
			case NOT_FOUND -> "AMap POI was not found";
			case MISSING_CONFIGURATION, UPSTREAM_FAILURE -> "Map service request failed";
		};
		ProblemDetail problem = problem(code, detail, request);
		return ResponseEntity.status(code.getStatus())
				.contentType(MediaType.APPLICATION_PROBLEM_JSON)
				.body(problem);
	}

	@ExceptionHandler(RouteEstimateException.class)
	ResponseEntity<ProblemDetail> handleRouteEstimateException(RouteEstimateException exception,
			HttpServletRequest request) {
		ApiErrorCode code = switch (exception.code()) {
			case MISSING_CONFIGURATION, UPSTREAM_FAILURE -> ApiErrorCode.UPSTREAM_FAILURE;
		};
		ProblemDetail problem = problem(code, "Map service request failed", request);
		return ResponseEntity.status(code.getStatus())
				.contentType(MediaType.APPLICATION_PROBLEM_JSON)
				.body(problem);
	}

	@Override
	protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception,
			HttpHeaders headers, HttpStatusCode status, WebRequest request) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Request validation failed");
		problem.setTitle(ApiErrorCode.VALIDATION_ERROR.getTitle());
		problem.setType(VALIDATION_TYPE);
		problem.setInstance(URI.create(request.getDescription(false).replace("uri=", "")));
		problem.setProperty("code", ApiErrorCode.VALIDATION_ERROR.name());
		problem.setProperty("errors", fieldErrors(exception));
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.contentType(MediaType.APPLICATION_PROBLEM_JSON)
				.body(problem);
	}

	@ExceptionHandler(Exception.class)
	ResponseEntity<ProblemDetail> handleUnexpected(Exception exception, HttpServletRequest request) {
		log.error("Unhandled exception", exception);
		ApiErrorCode code = ApiErrorCode.INTERNAL_ERROR;
		ProblemDetail problem = problem(code, "An unexpected error occurred", request);
		return ResponseEntity.status(code.getStatus())
				.contentType(MediaType.APPLICATION_PROBLEM_JSON)
				.body(problem);
	}

	private static ProblemDetail problem(ApiErrorCode code, String detail, HttpServletRequest request) {
		ProblemDetail problem = ProblemDetail.forStatusAndDetail(code.getStatus(), detail);
		problem.setTitle(code.getTitle());
		problem.setType(URI.create(code.getType()));
		problem.setInstance(URI.create(request.getRequestURI()));
		problem.setProperty("code", code.name());
		return problem;
	}

	private static List<Map<String, String>> fieldErrors(MethodArgumentNotValidException exception) {
		return exception.getBindingResult().getFieldErrors().stream()
				.map(error -> Map.of("field", error.getField(),
						"message", String.valueOf(error.getDefaultMessage())))
				.toList();
	}

}
