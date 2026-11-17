package com.pawtrip.server.infrastructure.amap.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServiceUnavailable;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.pawtrip.server.application.model.maps.RouteEstimateException;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Endpoint;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Mode;
import com.pawtrip.server.application.model.maps.RouteEstimateResult;
import com.pawtrip.server.infrastructure.amap.config.AmapProperties;
import com.pawtrip.server.infrastructure.amap.transport.AmapTransport;
import java.math.BigDecimal;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.Map;
import java.util.stream.Collectors;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AmapRouteEstimateAdapterTest {

	private static final Endpoint ORIGIN =
			new Endpoint("B023B09GXZ", new BigDecimal("120.0"), new BigDecimal("30.0"));
	private static final Endpoint DESTINATION =
			new Endpoint("B023B02842", new BigDecimal("120.1"), new BigDecimal("30.1"));

	private MockRestServiceServer mockServer;
	private AmapRouteEstimateAdapter adapter;

	@BeforeEach
	void setUp() {
		installAdapter("test-api-key");
	}

	private void installAdapter(String apiKey) {
		RestClient.Builder clientBuilder = RestClient.builder().baseUrl("https://restapi.amap.com");
		mockServer = MockRestServiceServer.bindTo(clientBuilder).build();
		AmapProperties properties =
				new AmapProperties(
						apiKey,
						"https://restapi.amap.com",
						Duration.ofSeconds(2),
						Duration.ofSeconds(5));
		adapter = new AmapRouteEstimateAdapter(new AmapTransport(clientBuilder.build(), properties));
	}

	@Test
	void drivingEstimateMapsParametersAndParsesTaxiCostAndDuration() {
		mockServer
				.expect(request -> {
					assertThat(request.getMethod()).isEqualTo(HttpMethod.GET);
					assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving");
					assertThat(queryParameters(request.getURI()))
							.containsEntry("origin", "120.000000,30.000000")
							.containsEntry("destination", "120.100000,30.100000")
							.containsEntry("show_fields", "cost")
							.containsEntry("origin_id", "B023B09GXZ")
							.containsEntry("destination_id", "B023B02842")
							.containsEntry("key", "test-api-key")
							.containsEntry("output", "json")
							.doesNotContainKey("strategy");
				})
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"taxi_cost\":\"127\",\"paths\":[{\"distance\":\"41532\",\"cost\":{\"duration\":\"2816\"}}]}}",
						MediaType.APPLICATION_JSON));

		RouteEstimateResult result =
				adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE));

		assertThat(result.taxiCostYuan()).isEqualByComparingTo(new BigDecimal("127"));
		assertThat(result.durationSeconds()).isEqualTo(2816L);
		mockServer.verify();
	}

	@Test
	void walkingEstimateMapsWalkingEndpointAndReturnsNullTaxiCost() {
		mockServer
				.expect(request -> {
					assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/walking");
					assertThat(queryParameters(request.getURI()))
							.containsEntry("origin", "120.000000,30.000000")
							.containsEntry("destination", "120.100000,30.100000")
							.containsEntry("show_fields", "cost")
							.containsEntry("origin_id", "B023B09GXZ")
							.containsEntry("destination_id", "B023B02842");
				})
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"paths\":[{\"distance\":\"38075\",\"cost\":{\"duration\":\"30460\"}}]}}",
						MediaType.APPLICATION_JSON));

		RouteEstimateResult result =
				adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.WALK));

		assertThat(result.taxiCostYuan()).isNull();
		assertThat(result.durationSeconds()).isEqualTo(30460L);
		mockServer.verify();
	}

	@Test
	void coordinatesAreFormattedToAtMostSixDecimalsLongitudeFirst() {
		Endpoint origin = new Endpoint(
				"B023B09GXZ", new BigDecimal("120.12345678"), new BigDecimal("30.98765432"));
		Endpoint destination = new Endpoint(
				"B023B02842", new BigDecimal("120.00000049"), new BigDecimal("30.00000099"));
		mockServer
				.expect(request -> assertThat(queryParameters(request.getURI()))
						.containsEntry("origin", "120.123456,30.987654")
						.containsEntry("destination", "120.000000,30.000000"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"taxi_cost\":\"12\",\"paths\":[{\"cost\":{\"duration\":\"600\"}}]}}",
						MediaType.APPLICATION_JSON));

		adapter.estimate(new RouteEstimateRequest(origin, destination, Mode.DRIVE));

		mockServer.verify();
	}

	@Test
	void businessFailureStatusIsTypedUpstreamFailureWithoutLeakingKey() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving"))
				.andRespond(withSuccess(
						"{\"status\":\"0\",\"infocode\":\"10001\",\"info\":\"invalid key test-api-key\"}",
						MediaType.APPLICATION_JSON));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)));
		mockServer.verify();
	}

	@Test
	void missingDurationIsTypedUpstreamFailure() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"taxi_cost\":\"127\",\"paths\":[{\"distance\":\"41532\"}]}}",
						MediaType.APPLICATION_JSON));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)));
		mockServer.verify();
	}

	@Test
	void nonNumericDurationIsTypedUpstreamFailure() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/walking"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"paths\":[{\"cost\":{\"duration\":\"abc\"}}]}}",
						MediaType.APPLICATION_JSON));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.WALK)));
		mockServer.verify();
	}

	@Test
	void emptyPathsIsTypedUpstreamFailure() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"taxi_cost\":\"127\",\"paths\":[]}}",
						MediaType.APPLICATION_JSON));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)));
		mockServer.verify();
	}

	@Test
	void missingTaxiCostOnDrivingIsTypedUpstreamFailure() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"paths\":[{\"cost\":{\"duration\":\"2816\"}}]}}",
						MediaType.APPLICATION_JSON));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)));
		mockServer.verify();
	}

	@Test
	void nonNumericTaxiCostOnDrivingIsTypedUpstreamFailure() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"route\":{\"taxi_cost\":\"not-a-number\",\"paths\":[{\"cost\":{\"duration\":\"2816\"}}]}}",
						MediaType.APPLICATION_JSON));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)));
		mockServer.verify();
	}

	@Test
	void missingApiKeyFailsWithTypedMissingConfigurationBeforeAnyOutboundRequest() {
		installAdapter("");

		assertThatThrownBy(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)))
				.isInstanceOf(RouteEstimateException.class)
				.satisfies(exception -> {
					assertThat(((RouteEstimateException) exception).code())
							.isEqualTo(RouteEstimateException.Code.MISSING_CONFIGURATION);
					assertThat(exception.getMessage()).doesNotContain("test-api-key");
				});
		mockServer.verify();
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void httpFailureIsTranslatedAndLogsDoNotExposeCredentials(CapturedOutput output) {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving"))
				.andRespond(withServiceUnavailable().body("test-api-key private-route-payload"));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)));

		assertThat(output.getAll()).doesNotContain("test-api-key", "private-route-payload", "key=");
		mockServer.verify();
	}

	@Test
	void connectionFailureIsTranslatedWithoutLeakingTheTransportException() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/walking"))
				.andRespond(withException(new ConnectException("connection failed: test-api-key")));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.WALK)));
		mockServer.verify();
	}

	@Test
	void timeoutFailureIsTranslatedWithoutLeakingTheTransportException() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/direction/driving"))
				.andRespond(withException(new SocketTimeoutException("timed out: test-api-key")));

		assertUpstreamFailure(() -> adapter.estimate(new RouteEstimateRequest(ORIGIN, DESTINATION, Mode.DRIVE)));
		mockServer.verify();
	}

	private static void assertUpstreamFailure(ThrowingCallable action) {
		assertThatThrownBy(action)
				.isInstanceOf(RouteEstimateException.class)
				.satisfies(exception -> {
					assertThat(((RouteEstimateException) exception).code())
							.isEqualTo(RouteEstimateException.Code.UPSTREAM_FAILURE);
					assertThat(exception.getMessage()).doesNotContain("test-api-key");
				});
	}

	private static Map<String, String> queryParameters(URI uri) {
		return Arrays.stream(uri.getRawQuery().split("&"))
				.map(parameter -> parameter.split("=", 2))
				.collect(
						Collectors.toMap(
								parameter -> decode(parameter[0]),
								parameter -> decode(parameter[1])));
	}

	private static String decode(String value) {
		return URLDecoder.decode(value, StandardCharsets.UTF_8);
	}
}