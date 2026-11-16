package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pawtrip.server.application.port.maps.PlaceSearchPort;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
class LocationQueryApiTest {

	private static final Path DB_PATH = Path.of("target", "location-query-api-test.db");
	private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();

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
	PawtripLocationRepository locationRepository;

	@Autowired
	LocationPhotoRepository photoRepository;

	@MockitoBean
	PlaceSearchPort placeSearchPort;

	@BeforeEach
	void seedLocations() {
		this.photoRepository.deleteAll();
		this.locationRepository.deleteAll();
		this.locationRepository.saveAll(List.of(
				location("poi-zhu-a", "情侣路", "attraction", "440402", "110000", 1, "DOG", 8.5, 40.0, true, false,
						1050L, null),
				location("poi-zhu-b", "珠海渔女", "attraction", "440402", "110000", 0, "DOG", null, null, true, null,
						null, null),
				location("poi-zhu-c", "海滨公园", "attraction", "440400", "110000", null, null, null, null, true, null,
						null, null),
				location("poi-zhu-d", "无名景点", "attraction", "440400", "110000", null, null, null, null, null, null,
						null, null),
				location("poi-zhu-e", "东澳岛", "attraction", "440400", "110000", 2, "CAT,DOG", 15.0, null, false, true,
						0L, false),
				location("poi-zhu-hotel", "某酒店", "hotel", "440402", "100000", 1, "DOG", null, null, null, null, null,
						null),
				location("poi-hz-a", "西湖", "attraction", "330106", "110000", 1, "DOG", null, null, null, null, null,
						null)));
		this.locationRepository.flush();
	}

	@Test
	void defaultListReturnsOnlyFriendlyAttractionsInCity() throws Exception {
		JsonNode body = json(get("/api/locations/attractions")
				.param("regionCode", "440400")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(body)).containsExactly("poi-zhu-a", "poi-zhu-e");
		assertThat(poiIds(body)).doesNotContain("poi-zhu-b", "poi-zhu-c", "poi-zhu-d", "poi-zhu-hotel");
		assertThat(body.path("totalElements").asLong()).isEqualTo(2);
		assertThat(item(body, "poi-zhu-a").path("maxPetsPerPerson").asInt()).isEqualTo(1);
	}

	@Test
	void includeWithoutRulesReturnsAllSavedAttractions() throws Exception {
		JsonNode body = json(get("/api/locations/attractions")
				.param("regionCode", "440400")
				.param("includeWithoutRules", "true")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(body)).containsExactly(
				"poi-zhu-a", "poi-zhu-b", "poi-zhu-c", "poi-zhu-d", "poi-zhu-e");
		assertThat(poiIds(body)).doesNotContain("poi-zhu-hotel");
		assertThat(item(body, "poi-zhu-b").path("maxPetsPerPerson").asInt()).isZero();
		assertThat(isNullOrMissing(item(body, "poi-zhu-c").path("maxPetsPerPerson"))).isTrue();
	}

	@Test
	void listItemsCarryFullPetPoliciesAndKeepExistingFields() throws Exception {
		JsonNode body = json(get("/api/locations/attractions")
				.param("regionCode", "440400")
				.param("includeWithoutRules", "true")
				.with(user("demo").roles("USER")));

		JsonNode friendly = item(body, "poi-zhu-a");
		assertThat(friendly.path("poiId").asString()).isEqualTo("poi-zhu-a");
		assertThat(friendly.path("name").asString()).isEqualTo("情侣路");
		assertThat(friendly.path("address").asString()).isEqualTo("测试地址");
		assertThat(friendly.path("maxPetsPerPerson").asInt()).isEqualTo(1);
		assertThat(friendly.path("petPolicies").path("allowedPetTypes").asString()).isEqualTo("DOG");
		assertThat(friendly.path("petPolicies").path("maxPetsPerPerson").asInt()).isEqualTo(1);
		assertThat(friendly.path("petPolicies").path("maxSinglePetWeightKg").asDouble()).isEqualTo(8.5);
		assertThat(friendly.path("petPolicies").path("maxSinglePetShoulderHeightCm").asDouble()).isEqualTo(40.0);
		assertThat(friendly.path("petPolicies").path("leashRequired").asBoolean()).isTrue();
		assertThat(friendly.path("petPolicies").path("vaccinationProofRequired").asBoolean()).isFalse();
		assertThat(friendly.path("petPolicies").path("extraFeeCents").asLong()).isEqualTo(1050L);
		assertThat(isNullOrMissing(friendly.path("petPolicies").path("reservationRequired"))).isTrue();

		JsonNode unconfigured = item(body, "poi-zhu-d");
		assertThat(unconfigured.path("petPolicies").isObject()).isTrue();
		assertThat(isNullOrMissing(unconfigured.path("petPolicies").path("maxPetsPerPerson"))).isTrue();
		assertThat(isNullOrMissing(unconfigured.path("petPolicies").path("allowedPetTypes"))).isTrue();
		assertThat(isNullOrMissing(unconfigured.path("petPolicies").path("leashRequired"))).isTrue();

		assertThat(body.path("page").asInt()).isEqualTo(1);
		assertThat(body.path("totalElements").asLong()).isEqualTo(5);
	}

	@Test
	void defaultListItemsAlsoCarryPetPolicies() throws Exception {
		JsonNode body = json(get("/api/locations/attractions")
				.param("regionCode", "440400")
				.with(user("demo").roles("USER")));

		assertThat(item(body, "poi-zhu-a").path("petPolicies").path("maxSinglePetWeightKg").asDouble())
			.isEqualTo(8.5);
		assertThat(item(body, "poi-zhu-e").path("petPolicies").path("allowedPetTypes").asString())
			.isEqualTo("CAT,DOG");
		assertThat(item(body, "poi-zhu-e").path("petPolicies").path("extraFeeCents").asLong()).isZero();
	}

	@Test
	void regionPrefixMatchesDistrictRegionCodes() throws Exception {
		JsonNode body = json(get("/api/locations/attractions")
				.param("regionCode", "440400")
				.with(user("demo").roles("USER")));

		assertThat(item(body, "poi-zhu-a").path("regionCode").asString()).isEqualTo("440402");
		assertThat(item(body, "poi-zhu-e").path("regionCode").asString()).isEqualTo("440400");
	}

	@Test
	void paginatesInIdOrder() throws Exception {
		JsonNode first = json(get("/api/locations/attractions")
				.param("regionCode", "440400")
				.param("page", "1")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));
		JsonNode second = json(get("/api/locations/attractions")
				.param("regionCode", "440400")
				.param("page", "2")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(first)).containsExactly("poi-zhu-a");
		assertThat(first.path("hasNext").asBoolean()).isTrue();
		assertThat(poiIds(second)).containsExactly("poi-zhu-e");
		assertThat(first.path("totalElements").asLong()).isEqualTo(2);
	}

	@Test
	void detailReturnsEightPoliciesAndNoAdminOnlyFields() throws Exception {
		JsonNode body = json(get("/api/locations/poi-zhu-a").with(user("demo").roles("USER")));

		assertThat(body.path("name").asString()).isEqualTo("情侣路");
		assertThat(body.path("petPolicies").path("allowedPetTypes").asString()).isEqualTo("DOG");
		assertThat(body.path("petPolicies").path("maxPetsPerPerson").asInt()).isEqualTo(1);
		assertThat(body.path("petPolicies").path("maxSinglePetWeightKg").asDouble()).isEqualTo(8.5);
		assertThat(body.path("petPolicies").path("maxSinglePetShoulderHeightCm").asDouble()).isEqualTo(40.0);
		assertThat(body.path("petPolicies").path("leashRequired").asBoolean()).isTrue();
		assertThat(body.path("petPolicies").path("vaccinationProofRequired").asBoolean()).isFalse();
		assertThat(body.path("petPolicies").path("extraFeeCents").asLong()).isEqualTo(1050L);
		assertThat(isNullOrMissing(body.path("petPolicies").path("reservationRequired"))).isTrue();
		assertThat(body.has("photos")).isFalse();
		assertThat(body.has("business")).isFalse();
		assertThat(body.has("poi")).isFalse();
	}

	@Test
	void detailReturnsNullsForUnconfiguredPolicies() throws Exception {
		JsonNode body = json(get("/api/locations/poi-zhu-d").with(user("demo").roles("USER")));

		assertThat(isNullOrMissing(body.path("petPolicies").path("maxPetsPerPerson"))).isTrue();
		assertThat(isNullOrMissing(body.path("petPolicies").path("allowedPetTypes"))).isTrue();
		assertThat(isNullOrMissing(body.path("petPolicies").path("leashRequired"))).isTrue();
	}

	@Test
	void unauthenticatedRequestsReturn401() throws Exception {
		this.mockMvc.perform(get("/api/locations/attractions").param("regionCode", "440400"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void unknownPoiIdReturns404() throws Exception {
		this.mockMvc.perform(get("/api/locations/missing").with(user("demo").roles("USER")))
				.andExpect(status().isNotFound());
	}

	@Test
	void invalidRegionAndPagingReturn400() throws Exception {
		for (MockHttpServletRequestBuilder request : List.of(
				get("/api/locations/attractions"),
				get("/api/locations/attractions").param("regionCode", "abc"),
				get("/api/locations/attractions").param("regionCode", "999999"),
				get("/api/locations/attractions").param("regionCode", "440400").param("page", "0"),
				get("/api/locations/attractions").param("regionCode", "440400").param("pageSize", "101"))) {
			this.mockMvc.perform(request.with(user("demo").roles("USER")))
					.andExpect(status().isBadRequest());
		}
	}

	@Test
	void readsOnlyDatabaseWithoutCallingAmap() throws Exception {
		json(get("/api/locations/attractions").param("regionCode", "440400").with(user("demo").roles("USER")));
		json(get("/api/locations/poi-zhu-a").with(user("demo").roles("USER")));

		verifyNoInteractions(this.placeSearchPort);
	}

	@Test
	void adminDetailDoesNotExposeEntryPolicyFields() throws Exception {
		this.mockMvc.perform(get("/api/admin/locations/poi-zhu-a").with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.entryPolicy").doesNotExist())
				.andExpect(jsonPath("$.petPolicies.entryNote").doesNotExist());
	}

	@Test
	void publicEndpointsAreReadOnly() throws Exception {
		this.mockMvc.perform(post("/api/locations/attractions")
						.with(user("demo").roles("USER"))
						.with(csrf()))
				.andExpect(status().isMethodNotAllowed());
	}

	private JsonNode json(MockHttpServletRequestBuilder request) throws Exception {
		MvcResult result = this.mockMvc.perform(request)
				.andExpect(status().isOk())
				.andReturn();
		return JSON_MAPPER.readTree(result.getResponse().getContentAsString());
	}

	private static List<String> poiIds(JsonNode body) {
		List<String> ids = new ArrayList<>();
		for (JsonNode item : body.path("items")) {
			ids.add(item.path("poiId").asString());
		}
		return ids;
	}

	private static JsonNode item(JsonNode body, String poiId) {
		for (JsonNode item : body.path("items")) {
			if (poiId.equals(item.path("poiId").asString())) {
				return item;
			}
		}
		throw new AssertionError("Missing item " + poiId);
	}

	private static boolean isNullOrMissing(JsonNode node) {
		return node.isNull() || node.isMissingNode();
	}

	private static PawtripLocation location(String poiId, String name, String typeGroup, String regionCode,
			String typeCode, Integer maxPetsPerPerson, String allowedPetTypes, Double maxWeight,
			Double maxShoulderHeight, Boolean leashRequired, Boolean vaccinationProofRequired, Long extraFeeCents,
			Boolean reservationRequired) {
		PawtripLocation location = new PawtripLocation(poiId, name, typeCode, typeGroup, "测试地址", null, null,
				regionCode, "{}", "{}", null, null);
		location.updatePetPolicies(allowedPetTypes, maxPetsPerPerson, maxWeight, maxShoulderHeight, leashRequired,
				vaccinationProofRequired, extraFeeCents, reservationRequired);
		return location;
	}

}
