package com.pawtrip.server.trip;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import com.pawtrip.server.application.model.maps.RouteEstimateException;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest;
import com.pawtrip.server.application.model.maps.RouteEstimateRequest.Mode;
import com.pawtrip.server.application.model.maps.RouteEstimateResult;
import com.pawtrip.server.application.port.maps.RouteEstimatePort;
import com.pawtrip.server.auth.AppUser;
import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.location.PawtripLocation;
import com.pawtrip.server.location.PawtripLocationRepository;
import com.pawtrip.server.pet.Pet;
import com.pawtrip.server.pet.PetRepository;
import com.pawtrip.server.pet.PetType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
class TripRouteEstimateApiTest {

	private static final Path DB_PATH = Path.of("target", "trip-route-estimate-api-test.db");

	private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();

	private static final String CITY_ADCODE = "330100";

	private static final String POI_ONE = "poi-route-one";

	private static final String POI_TWO = "poi-route-two";

	private static final String POI_NO_COORDS = "poi-route-no-coords";

	private static final String PLAN = """
			{"version":1,"days":[{"day":1,"stops":[{"poiId":"poi-route-one","toNext":"walk"},{"poiId":"poi-route-two"}]}],"unscheduled":[]}
			""";

	@DynamicPropertySource
	static void datasourceProperties(DynamicPropertyRegistry registry) {
		try {
			Files.deleteIfExists(DB_PATH);
		}
		catch (IOException exception) {
			throw new UncheckedIOException("Failed to reset test database", exception);
		}
		registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DB_PATH + "?foreign_keys=on");
	}

	@Autowired
	MockMvc mockMvc;

	@Autowired
	AppUserRepository appUserRepository;

	@Autowired
	PetRepository petRepository;

	@Autowired
	PawtripLocationRepository locationRepository;

	@Autowired
	TripRepository tripRepository;

	@MockitoBean
	RouteEstimatePort routeEstimatePort;

	private String username;

	private String otherUsername;

	private long petId;

	private long tripId;

	@BeforeEach
	void setUp() throws Exception {
		this.tripRepository.deleteAll();
		this.locationRepository.deleteAll();
		this.petRepository.deleteAll();
		this.username = "route-user-" + UUID.randomUUID();
		this.otherUsername = "route-other-" + UUID.randomUUID();
		AppUser user = this.appUserRepository.save(new AppUser(this.username, "hash", true));
		this.appUserRepository.save(new AppUser(this.otherUsername, "hash", true));
		this.petId = this.petRepository
			.save(new Pet(user.getId(), "Mimi", PetType.CAT, 4.5, 25.0, true, true, null, null))
			.getId();
		this.locationRepository.save(new PawtripLocation(POI_ONE, "西湖", "110000", "attraction", "杭州",
				120.0, 30.0, CITY_ADCODE, "{}", "{}", 1, 3));
		this.locationRepository.save(new PawtripLocation(POI_TWO, "灵隐寺", "110000", "attraction", "杭州",
				120.1, 30.1, CITY_ADCODE, "{}", "{}", 1, 2));
		this.locationRepository.save(new PawtripLocation(POI_NO_COORDS, "无坐标景点", "110000", "attraction", "杭州",
				null, null, CITY_ADCODE, "{}", "{}", 1, 2));
		this.tripId = createTrip(PLAN);
	}

	@Test
	void requiresAuthentication() throws Exception {
		this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "drive"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void hidesOtherUsersTrip() throws Exception {
		this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.with(user(this.otherUsername))
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "drive"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("TRIP_NOT_FOUND"));
	}

	@Test
	void rejectsMissingOrInvalidParameters() throws Exception {
		assertInvalidEstimate(null, POI_TWO, "drive");
		assertInvalidEstimate(POI_ONE, null, "drive");
		assertInvalidEstimate(POI_ONE, POI_TWO, null);
		assertInvalidEstimate("", POI_TWO, "drive");
		assertInvalidEstimate(POI_ONE, POI_TWO, "transit");
		assertInvalidEstimate(POI_ONE, POI_TWO, "self_drive");
		assertInvalidEstimate("missing-poi", POI_TWO, "drive");
		assertInvalidEstimate(POI_ONE, "missing-poi", "walk");
	}

	@Test
	void rejectsLocationsWithoutCoordinates() throws Exception {
		assertInvalidEstimate(POI_NO_COORDS, POI_TWO, "drive");
		assertInvalidEstimate(POI_ONE, POI_NO_COORDS, "walk");
	}

	@Test
	void drivingEstimateReturnsCostRangeAndCeiledMinutes() throws Exception {
		when(this.routeEstimatePort.estimate(any()))
			.thenReturn(new RouteEstimateResult(new BigDecimal("50"), 61L));

		this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.with(user(this.username))
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "drive"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.mode").value("drive"))
			.andExpect(jsonPath("$.durationMinutes").value(2))
			.andExpect(jsonPath("$.costLowYuan").value(40.0))
			.andExpect(jsonPath("$.costHighYuan").value(60.0));

		ArgumentCaptor<RouteEstimateRequest> captor = ArgumentCaptor.forClass(RouteEstimateRequest.class);
		verify(this.routeEstimatePort).estimate(captor.capture());
		RouteEstimateRequest request = captor.getValue();
		assertThat(request.mode()).isEqualTo(Mode.DRIVE);
		assertThat(request.origin().poiId()).isEqualTo(POI_ONE);
		assertThat(request.destination().poiId()).isEqualTo(POI_TWO);
		assertThat(request.origin().longitude()).isEqualByComparingTo(new BigDecimal("120.0"));
		assertThat(request.destination().latitude()).isEqualByComparingTo(new BigDecimal("30.1"));
	}

	@Test
	void walkingEstimateReturnsZeroCosts() throws Exception {
		when(this.routeEstimatePort.estimate(any()))
			.thenReturn(new RouteEstimateResult(null, 30460L));

		this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.with(user(this.username))
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "walk"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.mode").value("walk"))
			.andExpect(jsonPath("$.durationMinutes").value(508))
			.andExpect(jsonPath("$.costLowYuan").value(0.0))
			.andExpect(jsonPath("$.costHighYuan").value(0.0));
	}

	@Test
	void estimateNeverModifiesTheStoredPlan() throws Exception {
		JsonNode baseline = storedPlan();
		when(this.routeEstimatePort.estimate(any()))
			.thenReturn(new RouteEstimateResult(new BigDecimal("50"), 61L));

		this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.with(user(this.username))
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "drive"))
			.andExpect(status().isOk());
		assertThat(storedPlan()).isEqualTo(baseline);

		when(this.routeEstimatePort.estimate(any()))
			.thenThrow(new RouteEstimateException(
					RouteEstimateException.Code.UPSTREAM_FAILURE, "secret-key raw-upstream-payload"));
		this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.with(user(this.username))
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "drive"))
			.andExpect(status().isBadGateway());
		assertThat(storedPlan()).isEqualTo(baseline);
	}

	@Test
	void upstreamFailureMapsToBadGatewayWithoutLeakingKeyOrPayload() throws Exception {
		when(this.routeEstimatePort.estimate(any()))
			.thenThrow(new RouteEstimateException(
					RouteEstimateException.Code.UPSTREAM_FAILURE, "secret-key raw-upstream-payload"));

		MvcResult result = this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.with(user(this.username))
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "drive"))
			.andExpect(status().isBadGateway())
			.andExpect(jsonPath("$.code").value("UPSTREAM_FAILURE"))
			.andExpect(jsonPath("$.detail").value("Map service request failed"))
			.andReturn();
		assertThat(result.getResponse().getContentAsString())
			.doesNotContain("secret-key", "raw-upstream-payload");
	}

	@Test
	void missingConfigurationMapsToBadGateway() throws Exception {
		when(this.routeEstimatePort.estimate(any()))
			.thenThrow(new RouteEstimateException(
					RouteEstimateException.Code.MISSING_CONFIGURATION, "AMAP_API_KEY is not configured"));

		this.mockMvc.perform(get("/api/trips/{tripId}/route-estimate", this.tripId)
					.with(user(this.username))
					.param("fromPoiId", POI_ONE)
					.param("toPoiId", POI_TWO)
					.param("mode", "walk"))
			.andExpect(status().isBadGateway())
			.andExpect(jsonPath("$.code").value("UPSTREAM_FAILURE"));
	}

	private void assertInvalidEstimate(String fromPoiId, String toPoiId, String mode) throws Exception {
		var request = get("/api/trips/{tripId}/route-estimate", this.tripId).with(user(this.username));
		if (fromPoiId != null) {
			request = request.param("fromPoiId", fromPoiId);
		}
		if (toPoiId != null) {
			request = request.param("toPoiId", toPoiId);
		}
		if (mode != null) {
			request = request.param("mode", mode);
		}
		this.mockMvc.perform(request)
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	private JsonNode storedPlan() throws Exception {
		MvcResult detail = this.mockMvc.perform(get("/api/trips/{tripId}", this.tripId).with(user(this.username)))
			.andExpect(status().isOk())
			.andReturn();
		return JSON_MAPPER.readTree(detail.getResponse().getContentAsString()).path("plan");
	}

	private long createTrip(String planJson) throws Exception {
		MvcResult result = this.mockMvc.perform(post("/api/trips")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"估算行程","cityAdcode":"%s","petId":%d,"totalDays":1,"plan":%s}
							""".formatted(CITY_ADCODE, this.petId, planJson)))
			.andExpect(status().isCreated())
			.andReturn();
		return JSON_MAPPER.readTree(result.getResponse().getContentAsString()).path("id").asLong();
	}

}