package com.pawtrip.server.trip;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import com.pawtrip.server.auth.AppUser;
import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.location.PawtripLocation;
import com.pawtrip.server.location.PawtripLocationRepository;
import com.pawtrip.server.pet.Pet;
import com.pawtrip.server.pet.PetRepository;
import com.pawtrip.server.pet.PetType;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
class TripApiTest {

	private static final Path DB_PATH = Path.of("target", "trip-api-test.db");

	private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();

	private static final String CITY_ADCODE = "330100";

	private static final String POI_ONE = "poi-trip-one";

	private static final String POI_TWO = "poi-trip-two";

	private static final String EMPTY_PLAN = "{\"version\":1,\"days\":[],\"unscheduled\":[]}";

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

	private String username;

	private String otherUsername;

	private long petId;

	private long otherPetId;

	@BeforeEach
	void setUp() {
		this.tripRepository.deleteAll();
		this.locationRepository.deleteAll();
		this.petRepository.deleteAll();
		this.username = "trip-user-" + UUID.randomUUID();
		this.otherUsername = "trip-other-" + UUID.randomUUID();
		AppUser user = this.appUserRepository.save(new AppUser(this.username, "hash", true));
		AppUser other = this.appUserRepository.save(new AppUser(this.otherUsername, "hash", true));
		this.petId = this.petRepository
			.save(new Pet(user.getId(), "Mimi", PetType.CAT, 4.5, 25.0, true, true, null, null))
			.getId();
		this.otherPetId = this.petRepository
			.save(new Pet(other.getId(), "Rex", PetType.DOG, 18.0, 60.0, true, true, null, null))
			.getId();
		this.locationRepository.save(new PawtripLocation(POI_ONE, "西湖", "110000", "attraction", "杭州",
				120.0, 30.0, CITY_ADCODE, "{}", "{}", 1, 3));
		this.locationRepository.save(new PawtripLocation(POI_TWO, "灵隐寺", "110000", "attraction", "杭州",
				120.1, 30.1, CITY_ADCODE, "{}", "{}", 1, 2));
	}

	@Test
	void createsMultipleTripsAndListsOnlyOwnSummaries() throws Exception {
		long first = createTrip(this.username, "杭州两日", CITY_ADCODE, this.petId, 2, null);
		long second = createTrip(this.username, "杭州三日", CITY_ADCODE, this.petId, 3, EMPTY_PLAN);

		this.mockMvc.perform(get("/api/trips").with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[0].id").value(first))
			.andExpect(jsonPath("$[0].name").value("杭州两日"))
			.andExpect(jsonPath("$[0].cityAdcode").value(CITY_ADCODE))
			.andExpect(jsonPath("$[0].petId").value(this.petId))
			.andExpect(jsonPath("$[0].totalDays").value(2))
			.andExpect(jsonPath("$[0].createdAt").isString())
			.andExpect(jsonPath("$[0].updatedAt").isString())
			.andExpect(jsonPath("$[0].plan").doesNotExist())
			.andExpect(jsonPath("$[1].id").value(second));

		this.mockMvc.perform(get("/api/trips").with(user(this.otherUsername)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void createsTripWithDefaultEmptyPlan() throws Exception {
		long tripId = createTrip(this.username, "空计划", CITY_ADCODE, this.petId, 1, null);

		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.plan.version").value(1))
			.andExpect(jsonPath("$.plan.days.length()").value(0))
			.andExpect(jsonPath("$.plan.unscheduled.length()").value(0))
			.andExpect(jsonPath("$.transportMode").value(nullValue()));
	}

	@Test
	void createsAndUpdatesTransportModeAndRejectsUnsupportedMode() throws Exception {
		MvcResult createResult = this.mockMvc.perform(post("/api/trips")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"杭州行程","cityAdcode":"%s","petId":%d,"totalDays":1,
							 "transportMode":"flight"}
							""".formatted(CITY_ADCODE, this.petId)))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.transportMode").value("flight"))
			.andReturn();
		long tripId = JSON_MAPPER.readTree(createResult.getResponse().getContentAsString()).path("id").asLong();

		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"杭州行程","totalDays":1,"plan":%s,"transportMode":"high_speed_rail"}
							""".formatted(EMPTY_PLAN)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.transportMode").value("high_speed_rail"));

		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"杭州行程","totalDays":1,"plan":%s,"transportMode":"spaceship"}
							""".formatted(EMPTY_PLAN)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.transportMode").value("high_speed_rail"));
	}

	@Test
	void keepsRepeatedPoiIdsAndOptionalToNext() throws Exception {
		String plan = """
				{"version":1,"days":[
					{"day":1,"stops":[
						{"poiId":"poi-trip-one"},
						{"poiId":"poi-trip-two","toNext":"walk"}
					]},
					{"day":2,"stops":[
						{"poiId":"poi-trip-one","toNext":null}
					]}
				],"unscheduled":[]}
				""";

		long tripId = createTrip(this.username, "重复地点", CITY_ADCODE, this.petId, 2, plan);

		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.plan.days.length()").value(2))
			.andExpect(jsonPath("$.plan.days[0].stops.length()").value(2))
			.andExpect(jsonPath("$.plan.days[0].stops[0].poiId").value(POI_ONE))
			.andExpect(jsonPath("$.plan.days[0].stops[0].toNext").value(nullValue()))
			.andExpect(jsonPath("$.plan.days[0].stops[1].toNext").value("walk"))
			.andExpect(jsonPath("$.plan.days[1].stops[0].poiId").value(POI_ONE))
			.andExpect(jsonPath("$.plan.days[1].stops[0].toNext").value(nullValue()));
	}

	@Test
	void normalizesUnscheduledDuplicatesAndScheduledOverlap() throws Exception {
		String plan = """
				{"version":1,"days":[
					{"day":1,"stops":[{"poiId":"poi-trip-one"}]}
				],"unscheduled":[
					{"poiId":"poi-trip-two"},
					{"poiId":"poi-trip-two"},
					{"poiId":"poi-trip-one"}
				]}
				""";

		long tripId = createTrip(this.username, "池去重", CITY_ADCODE, this.petId, 1, plan);

		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.plan.unscheduled.length()").value(1))
			.andExpect(jsonPath("$.plan.unscheduled[0].poiId").value(POI_TWO));
	}

	@Test
	void rejectsInvalidBindingReferencesAndPlanValues() throws Exception {
		assertInvalidCreate("""
				{"name":"省份","cityAdcode":"330000","petId":%d,"totalDays":1}
				""".formatted(this.petId));
		assertInvalidCreate("""
				{"name":"不存在城市","cityAdcode":"999999","petId":%d,"totalDays":1}
				""".formatted(this.petId));
		assertInvalidCreate("""
				{"name":"他人宠物","cityAdcode":"%s","petId":%d,"totalDays":1}
				""".formatted(CITY_ADCODE, this.otherPetId));
		assertInvalidCreate("""
				{"name":"","cityAdcode":"%s","petId":%d,"totalDays":1}
				""".formatted(CITY_ADCODE, this.petId));
		assertInvalidCreate("""
				{"name":"零天","cityAdcode":"%s","petId":%d,"totalDays":0}
				""".formatted(CITY_ADCODE, this.petId));
		assertInvalidCreate("""
				{"name":"不存在地点","cityAdcode":"%s","petId":%d,"totalDays":1,
				 "plan":{"version":1,"days":[{"day":1,"stops":[{"poiId":"missing-poi"}]}],"unscheduled":[]}}
				""".formatted(CITY_ADCODE, this.petId));
		assertInvalidCreate("""
				{"name":"非法交通","cityAdcode":"%s","petId":%d,"totalDays":1,
				 "plan":{"version":1,"days":[{"day":1,"stops":[{"poiId":"%s","toNext":"bus"}]}],"unscheduled":[]}}
				""".formatted(CITY_ADCODE, this.petId, POI_ONE));
		assertInvalidCreate("""
				{"name":"天数越界","cityAdcode":"%s","petId":%d,"totalDays":1,
				 "plan":{"version":1,"days":[{"day":2,"stops":[]}],"unscheduled":[]}}
				""".formatted(CITY_ADCODE, this.petId));
	}

	@Test
	void keepsCityAndPetImmutableOnUpdate() throws Exception {
		long tripId = createTrip(this.username, "原名称", CITY_ADCODE, this.petId, 2, EMPTY_PLAN);

		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"新名称","cityAdcode":"999999","petId":%d,"totalDays":2,"plan":%s}
							""".formatted(this.otherPetId, EMPTY_PLAN)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("新名称"))
			.andExpect(jsonPath("$.cityAdcode").value(CITY_ADCODE))
			.andExpect(jsonPath("$.petId").value(this.petId));

		Trip stored = this.tripRepository.findById(tripId).orElseThrow();
		assertThat(stored.getCityAdcode()).isEqualTo(CITY_ADCODE);
		assertThat(stored.getPetId()).isEqualTo(this.petId);
		assertThat(stored.getName()).isEqualTo("新名称");
	}

	@Test
	void rejectsShrinkingTotalDaysBelowMaximumDay() throws Exception {
		String plan = """
				{"version":1,"days":[{"day":3,"stops":[{"poiId":"poi-trip-one"}]}],"unscheduled":[]}
				""";
		long tripId = createTrip(this.username, "三天", CITY_ADCODE, this.petId, 3, plan);

		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"两天","totalDays":2,"plan":%s}
							""".formatted(plan)))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalDays").value(3))
			.andExpect(jsonPath("$.plan.days[0].day").value(3));

		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"三天","totalDays":3,"plan":%s}
							""".formatted(plan)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalDays").value(3));
	}

	@Test
	void allowsShrinkingAnEmptyPlanToOneDay() throws Exception {
		long tripId = createTrip(this.username, "五天", CITY_ADCODE, this.petId, 5, null);

		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"一天","totalDays":1,"plan":%s}
							""".formatted(EMPTY_PLAN)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalDays").value(1));
	}

	@Test
	void rejectsUpdateWithoutPlan() throws Exception {
		long tripId = createTrip(this.username, "原计划", CITY_ADCODE, this.petId, 1, null);

		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"无计划","totalDays":1}
							"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void hidesOtherUsersTripsAndDeletesOwnTrip() throws Exception {
		long tripId = createTrip(this.username, "私有行程", CITY_ADCODE, this.petId, 1, null);

		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.otherUsername)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("TRIP_NOT_FOUND"));
		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.otherUsername))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"劫持","totalDays":1,"plan":%s}
							""".formatted(EMPTY_PLAN)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("TRIP_NOT_FOUND"));
		this.mockMvc.perform(delete("/api/trips/{tripId}", tripId)
					.with(user(this.otherUsername))
					.with(csrf()))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("TRIP_NOT_FOUND"));

		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.username)))
			.andExpect(status().isOk());

		this.mockMvc.perform(delete("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isNoContent());
		this.mockMvc.perform(get("/api/trips/{tripId}", tripId).with(user(this.username)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("TRIP_NOT_FOUND"));
	}

	@Test
	void requiresAuthenticationForTripEndpoints() throws Exception {
		this.mockMvc.perform(get("/api/trips"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
		this.mockMvc.perform(get("/api/trips/1"))
			.andExpect(status().isUnauthorized());
		this.mockMvc.perform(post("/api/trips")
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{}"))
			.andExpect(status().isUnauthorized());
	}

	private long createTrip(String owner, String name, String cityAdcode, long petId, int totalDays, String planJson)
			throws Exception {
		String body = planJson == null
				? """
						{"name":"%s","cityAdcode":"%s","petId":%d,"totalDays":%d}
						""".formatted(name, cityAdcode, petId, totalDays)
				: """
						{"name":"%s","cityAdcode":"%s","petId":%d,"totalDays":%d,"plan":%s}
						""".formatted(name, cityAdcode, petId, totalDays, planJson);
		MvcResult result = this.mockMvc.perform(post("/api/trips")
					.with(user(owner))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
			.andExpect(status().isCreated())
			.andExpect(header().exists("Location"))
			.andReturn();
		JsonNode response = JSON_MAPPER.readTree(result.getResponse().getContentAsString());
		long tripId = response.path("id").asLong();
		assertThat(result.getResponse().getHeader("Location")).isEqualTo("/api/trips/" + tripId);
		return tripId;
	}

	private void assertInvalidCreate(String body) throws Exception {
		this.mockMvc.perform(post("/api/trips")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

}
