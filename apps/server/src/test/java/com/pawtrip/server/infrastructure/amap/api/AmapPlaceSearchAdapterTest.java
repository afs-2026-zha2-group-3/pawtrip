package com.pawtrip.server.infrastructure.amap.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServiceUnavailable;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.pawtrip.server.application.model.maps.KeywordPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.NearbyPlaceSearchRequest;
import com.pawtrip.server.application.model.maps.PlaceSearchException;
import com.pawtrip.server.application.model.maps.PlaceTypeSearchRequest;
import com.pawtrip.server.infrastructure.amap.config.AmapProperties;
import com.pawtrip.server.infrastructure.amap.transport.AmapTransport;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.http.HttpMethod;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class AmapPlaceSearchAdapterTest {

	private MockRestServiceServer mockServer;
	private AmapPlaceSearchAdapter adapter;
	private final JsonMapper jsonMapper = JsonMapper.builder().build();

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
		adapter = new AmapPlaceSearchAdapter(new AmapTransport(clientBuilder.build(), properties));
	}

	@Test
	void keywordSearchMapsInputToTextEndpointAndDefaultPagination() {
		mockServer
				.expect(
						request -> {
							assertThat(request.getMethod()).isEqualTo(HttpMethod.GET);
						assertThat(request.getURI().getPath()).isEqualTo("/v5/place/text");
						assertThat(queryParameters(request.getURI()))
								.containsEntry("keywords", "cafe & dog")
								.containsEntry("page_num", "1")
								.containsEntry("page_size", "10")
								.containsEntry("key", "test-api-key")
								.containsEntry("output", "json");
					})
				.andRespond(
						withSuccess(
								"{\"status\":\"1\",\"infocode\":\"10000\",\"count\":\"1\",\"pois\":[{\"name\":\"Paw Cafe\"}]}",
								MediaType.APPLICATION_JSON));

		var result = adapter.searchByKeyword(new KeywordPlaceSearchRequest("cafe & dog", null, null));

		assertThat(result.totalCount()).isEqualTo(1);
		assertThat(result.pageNum()).isEqualTo(1);
		assertThat(result.pageSize()).isEqualTo(10);
		assertThat(result.pois().getFirst().path("name").asString("")).isEqualTo("Paw Cafe");
		mockServer.verify();
	}

	@Test
	void typeSearchWithoutKeywordsMapsTypeCodesRegionAndStrictLimitToTextEndpoint() {
		mockServer
				.expect(
						request -> {
							assertThat(request.getURI().getPath()).isEqualTo("/v5/place/text");
						assertThat(queryParameters(request.getURI()))
								.containsEntry("types", "110000|110100")
								.containsEntry("region", "330100")
								.containsEntry("city_limit", "true")
								.containsEntry("page_num", "2")
								.containsEntry("page_size", "25")
								.doesNotContainKey("keywords");
					})
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"count\":\"25\",\"pois\":[]}",
						MediaType.APPLICATION_JSON));

		var result = adapter.searchByTypes(new PlaceTypeSearchRequest(
				List.of("110000", "110100"), "330100", 2, 25));

		assertThat(result.totalCount()).isEqualTo(25);
		assertThat(result.pageNum()).isEqualTo(2);
		assertThat(result.pageSize()).isEqualTo(25);
		mockServer.verify();
	}

	@Test
	void detailSearchRequestsBusinessAndPhotosAndPreservesUnknownNestedFields() throws IOException {
		String poiId = "B000A7BM4H";
		String response = """
				{"status":"1","infocode":"10000","pois":[{"id":"B000A7BM4H","name":"景点","business":{"rating":"4.8","vendor_extra":{"open":true}},"photos":[{"title":"门口","url":"https://img.example.test/a.jpg","future":{"rank":2}}],"future_field":{"nested":[1,2]}}]}
				""";
		JsonNode expected = jsonMapper.readTree(response).path("pois").get(0);
		mockServer
				.expect(request -> {
					assertThat(request.getURI().getPath()).isEqualTo("/v5/place/detail");
					assertThat(queryParameters(request.getURI()))
							.containsEntry("id", poiId)
							.containsEntry("show_fields", "business,photos")
							.containsEntry("key", "test-api-key");
				})
				.andRespond(withSuccess(response, MediaType.APPLICATION_JSON));

		assertThat(adapter.getPlaceById(poiId)).isEqualTo(expected);
		mockServer.verify();
	}

	@Test
	void detailSearchAllowsMissingOptionalFieldsAndPreservesUnknownFields() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/place/detail"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"pois\":[{\"id\":\"B000A7BM4H\",\"name\":\"No extras\",\"custom\":{\"retained\":true}}]}",
						MediaType.APPLICATION_JSON));

		JsonNode result = adapter.getPlaceById("B000A7BM4H");

		assertThat(result.path("name").asString()).isEqualTo("No extras");
		assertThat(result.has("business")).isFalse();
		assertThat(result.has("photos")).isFalse();
		assertThat(result.path("custom").path("retained").asBoolean()).isTrue();
		mockServer.verify();
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void detailSearchTranslatesUpstreamFailuresWithoutLeakingCredentialsOrPoiData(CapturedOutput output) {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/place/detail"))
				.andRespond(withServiceUnavailable().body("test-api-key private-poi-id"));

		assertThatThrownBy(() -> adapter.getPlaceById("B000A7BM4H"))
				.isInstanceOf(PlaceSearchException.class)
				.hasMessage("AMap POI search failed");
		assertThat(output.getAll()).doesNotContain("test-api-key", "private-poi-id", "key=");
		mockServer.verify();
	}

	@Test
	void detailSearchReturnsNotFoundForAnEmptySuccessfulResponse() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/place/detail"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"pois\":[]}",
						MediaType.APPLICATION_JSON));

		assertThatThrownBy(() -> adapter.getPlaceById("B000A7BM4H"))
				.isInstanceOf(PlaceSearchException.class)
				.satisfies(exception -> assertThat(((PlaceSearchException) exception).code())
						.isEqualTo(PlaceSearchException.Code.NOT_FOUND));
		mockServer.verify();
	}

	@Test
	void typeSearchAllowsLastPartiallyReachablePageAndRejectsPagesPastTwoHundredResults() {
		mockServer
				.expect(request -> assertThat(queryParameters(request.getURI()))
						.containsEntry("page_num", "9")
						.containsEntry("page_size", "24"))
				.andRespond(withSuccess(
						"{\"status\":\"1\",\"infocode\":\"10000\",\"count\":\"200\",\"pois\":[]}",
						MediaType.APPLICATION_JSON));

		adapter.searchByTypes(new PlaceTypeSearchRequest(List.of("110000"), null, 9, 24));
		assertInvalidArgument(() -> adapter.searchByTypes(
				new PlaceTypeSearchRequest(List.of("110000"), null, 9, 25)));
		assertInvalidArgument(() -> adapter.searchByTypes(
				new PlaceTypeSearchRequest(List.of("110000"), null, 101, 1)));
		mockServer.verify();
	}

	@Test
	void nearbySearchMapsInputToAroundEndpointAndDefaultFilters() {
		mockServer
				.expect(
						request -> {
							assertThat(request.getMethod()).isEqualTo(HttpMethod.GET);
						assertThat(request.getURI().getPath()).isEqualTo("/v5/place/around");
						assertThat(queryParameters(request.getURI()))
								.containsEntry("location", "116.473168,39.993015")
								.containsEntry("radius", "5000")
								.containsEntry("types", "050000|070000|120000")
								.containsEntry("page_num", "1")
								.containsEntry("page_size", "10")
								.containsEntry("key", "test-api-key");
					})
				.andRespond(
						withSuccess(
								"{\"status\":\"1\",\"infocode\":\"10000\",\"count\":\"0\",\"pois\":[]}",
								MediaType.APPLICATION_JSON));

		var result =
				adapter.searchNearby(
						new NearbyPlaceSearchRequest(
								new BigDecimal("116.473168"),
								new BigDecimal("39.993015"),
								null,
								null,
								null,
								null,
								null));

		assertThat(result.totalCount()).isZero();
		mockServer.verify();
	}

	@Test
	void keywordSearchPreservesTheCompleteFixturePoiAndPagingMetadata() throws IOException {
		String fixture = readFixture("keyword-search-response.json");
		JsonNode expectedPoi = jsonMapper.readTree(fixture).path("pois").get(0);
		mockServer
				.expect(
						request -> {
							assertThat(request.getURI().getPath()).isEqualTo("/v5/place/text");
							assertThat(queryParameters(request.getURI()))
									.containsEntry("keywords", "pet friendly")
									.containsEntry("page_num", "2")
									.containsEntry("page_size", "20");
						})
				.andRespond(withSuccess(fixture, MediaType.APPLICATION_JSON));

		var result =
				adapter.searchByKeyword(new KeywordPlaceSearchRequest("pet friendly", 2, 20));

		assertThat(result.totalCount()).isEqualTo(37);
		assertThat(result.pageNum()).isEqualTo(2);
		assertThat(result.pageSize()).isEqualTo(20);
		assertThat(result.pois()).containsExactly(expectedPoi);
		mockServer.verify();
	}

	@Test
	void nearbySearchPreservesTheCompleteFixturePoisAndPagingMetadata() throws IOException {
		String fixture = readFixture("nearby-search-response.json");
		JsonNode response = jsonMapper.readTree(fixture);
		mockServer
				.expect(
						request -> {
							assertThat(request.getURI().getPath()).isEqualTo("/v5/place/around");
							assertThat(queryParameters(request.getURI()))
									.containsEntry("location", "0.000001,0.000002")
									.containsEntry("keywords", "sample park")
									.containsEntry("types", "110101")
									.containsEntry("radius", "1000")
									.containsEntry("page_num", "2")
									.containsEntry("page_size", "5");
						})
				.andRespond(withSuccess(fixture, MediaType.APPLICATION_JSON));

		var result =
				adapter.searchNearby(
						new NearbyPlaceSearchRequest(
								new BigDecimal("0.000001"),
								new BigDecimal("0.000002"),
								"sample park",
								"110101",
								1000,
								2,
								5));

		assertThat(result.totalCount()).isEqualTo(2);
		assertThat(result.pageNum()).isEqualTo(2);
		assertThat(result.pageSize()).isEqualTo(5);
		assertThat(result.pois())
				.containsExactly(response.path("pois").get(0), response.path("pois").get(1));
		mockServer.verify();
	}

	@Test
	void invalidInputsFailBeforeAnyOutboundRequest() {
		assertInvalidArgument(
				() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("  ", null, null)));
		assertInvalidArgument(
				() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("🙂".repeat(81), null, null)));
		assertInvalidArgument(
				() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("cafe", null, 0)));
		assertInvalidArgument(
				() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("cafe", 9, 25)));
		assertInvalidArgument(
						() -> adapter.searchNearby(
								new NearbyPlaceSearchRequest(
										new BigDecimal("0.0000001"),
										BigDecimal.ZERO,
										null,
										null,
										null,
										null,
										null)));
				assertInvalidArgument(() -> adapter.searchByTypes(new PlaceTypeSearchRequest(List.of(), null, 1, 25)));
				assertInvalidArgument(() -> adapter.searchByTypes(
						new PlaceTypeSearchRequest(List.of("not-a-type"), null, 1, 25)));
				assertInvalidArgument(() -> adapter.searchByTypes(
						new PlaceTypeSearchRequest(List.of("110000"), "invalid-region", 1, 25)));
				assertInvalidArgument(() -> adapter.getPlaceById("invalid|poi-id"));
		assertInvalidArgument(
				() ->
						adapter.searchNearby(
								new NearbyPlaceSearchRequest(
										new BigDecimal("181"),
										BigDecimal.ZERO,
										null,
										null,
										null,
										null,
										null)));
		assertInvalidArgument(
				() ->
						adapter.searchNearby(
								new NearbyPlaceSearchRequest(
										BigDecimal.ZERO,
										BigDecimal.ZERO,
										null,
										null,
										50001,
										null,
										null)));
		mockServer.verify();
	}

	@Test
	void missingApiKeyFailsWithTypedInternalErrorBeforeAnyOutboundRequest() {
		installAdapter("");

		assertThatThrownBy(
					() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("private query", null, null)))
				.isInstanceOf(PlaceSearchException.class)
				.satisfies(
						exception -> {
							assertThat(((PlaceSearchException) exception).code())
									.isEqualTo(PlaceSearchException.Code.MISSING_CONFIGURATION);
							assertThat(exception.getMessage()).doesNotContain("private query", "test-api-key");
						});
		mockServer.verify();
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void httpFailureIsTranslatedAndLogsDoNotExposeCredentialsOrSearchTerms(CapturedOutput output) {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/place/text"))
				.andRespond(withServiceUnavailable().body("test-api-key private query"));

		assertUpstreamFailure(
				() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("private query", null, null)));

		assertThat(output.getAll()).doesNotContain("test-api-key", "private query", "key=");
		mockServer.verify();
	}

	@Test
	void connectionFailureIsTranslatedWithoutLeakingTheTransportException() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/place/text"))
				.andRespond(withException(new ConnectException("connection failed: test-api-key")));

		assertUpstreamFailure(
				() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("private query", null, null)));
		mockServer.verify();
	}

	@Test
	void timeoutFailureIsTranslatedWithoutLeakingTheTransportException() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/place/text"))
				.andRespond(withException(new SocketTimeoutException("timed out for private query")));

		assertUpstreamFailure(
				() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("private query", null, null)));
		mockServer.verify();
	}

	@Test
	void amapBusinessFailureIsReturnedAsTypedInternalError() {
		mockServer
				.expect(request -> assertThat(request.getURI().getPath()).isEqualTo("/v5/place/text"))
				.andRespond(
						withSuccess(
								"{\"status\":\"0\",\"infocode\":\"10001\",\"info\":\"invalid key\"}",
								MediaType.APPLICATION_JSON));

		assertThatThrownBy(
						() -> adapter.searchByKeyword(new KeywordPlaceSearchRequest("cafe", null, null)))
				.satisfies(
						exception ->
								assertThat(((PlaceSearchException) exception).code())
										.isEqualTo(PlaceSearchException.Code.UPSTREAM_FAILURE));
		mockServer.verify();
	}

	private static void assertInvalidArgument(ThrowingCallable action) {
		assertThatThrownBy(action)
				.isInstanceOf(PlaceSearchException.class)
				.satisfies(
						exception ->
								assertThat(((PlaceSearchException) exception).code())
										.isEqualTo(PlaceSearchException.Code.INVALID_ARGUMENT));
	}

	private static void assertUpstreamFailure(ThrowingCallable action) {
		assertThatThrownBy(action)
				.isInstanceOf(PlaceSearchException.class)
				.satisfies(
						exception -> {
							assertThat(((PlaceSearchException) exception).code())
									.isEqualTo(PlaceSearchException.Code.UPSTREAM_FAILURE);
							assertThat(exception.getMessage())
									.doesNotContain("test-api-key", "private query");
						});
	}

	private String readFixture(String fileName) throws IOException {
		try (InputStream fixture = getClass().getResourceAsStream("/fixtures/amap/" + fileName)) {
			if (fixture == null) {
				throw new IllegalStateException("Missing test fixture: " + fileName);
			}
			return new String(fixture.readAllBytes(), StandardCharsets.UTF_8);
		}
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
