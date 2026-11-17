package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
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
				locationAt("poi-zhu-a", "情侣路", "attraction", "440402", "110000", 113.5, 22.1, 1, "DOG", 8.5, 40.0,
						true, false, 1050L, null, "{\"rating\":\"4.6\"}"),
				location("poi-zhu-b", "珠海渔女", "attraction", "440402", "110000", 0, "DOG", null, null, true, null,
						null, null),
				location("poi-zhu-c", "海滨公园", "attraction", "440400", "110000", null, null, null, null, true, null,
						null, null),
				location("poi-zhu-d", "无名景点", "attraction", "440400", "110000", null, null, null, null, null, null,
						null, null),
				location("poi-zhu-e", "东澳岛", "attraction", "440400", "110000", 2, "CAT,DOG", 15.0, null, false, true,
						0L, false),
				locationAt("poi-zhu-hotel", "某酒店", "hotel", "440402", "100000", 113.5, 22.105, 1, "DOG", null, null,
						null, null, null, null),
				locationAt("poi-zhu-hotel-no-policy", "未配置酒店", "hotel", "440402", "100000", 113.5, 22.16, null,
						null, null, null, null, null, null, null),
				location("poi-zhu-hospital", "宠物医院", "pet-hospital", "440402", "090700", 1, "DOG", null, null,
						null, null, null, null),
				location("poi-zhu-supplies", "宠物用品店", "pet-supplies", "440402", "061211", 1, "DOG", null, null,
						null, null, null, null),
				locationAt("poi-zhu-restaurant", "宠物餐厅", "restaurant", "440402", "050000", 113.5, 22.102, 1, "DOG",
						null, null, null, null, null, null),
				locationAt("poi-zhu-restaurant-close", "近距离餐厅", "restaurant", "440402", "050000", 113.5, 22.1005, 0,
						"DOG", null, null, null, null, null, null),
				locationAt("poi-zhu-restaurant-far", "远距离餐厅", "restaurant", "440402", "050000", 113.5, 22.16, 1,
						"DOG", null, null, null, null, null, null),
				locationAt("poi-zhu-restaurant-null", "无坐标餐厅", "restaurant", "440402", "050000", null, null, 1,
						"DOG", null, null, null, null, null, null),
				location("poi-hz-a", "西湖", "attraction", "330106", "110000", 1, "DOG", null, null, null, null, null,
						null),
				location("poi-hz-hotel", "杭州酒店", "hotel", "330106", "100000", 1, "DOG", null, null, null, null,
						null, null)));
		this.locationRepository.flush();
		PawtripLocation rated = this.locationRepository.findByPoiId("poi-zhu-a").orElseThrow();
		this.photoRepository.saveAll(List.of(
				new LocationPhoto(rated.getId(), 1, "{}", "第二张", "https://photos.example/a-1.png"),
				new LocationPhoto(rated.getId(), 0, "{}", "第一张", "https://photos.example/a-0.png")));
		this.locationRepository.saveAll(List.of(
				locationWithBusiness("poi-hz-blank", "空白评分景点", "330106", "{\"rating\":\"  \"}"),
				locationWithBusiness("poi-hz-bad", "非法快照景点", "330106", "not-json")));
		this.locationRepository.flush();
	}

	@Test
	void defaultListReturnsOnlyFriendlyAttractionsInCity() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(body)).containsExactly("poi-zhu-a", "poi-zhu-e");
		assertThat(poiIds(body)).doesNotContain("poi-zhu-b", "poi-zhu-c", "poi-zhu-d", "poi-zhu-hotel");
		assertThat(body.path("totalElements").asLong()).isEqualTo(2);
		assertThat(item(body, "poi-zhu-a").path("maxPetsPerPerson").asInt()).isEqualTo(1);
	}

	@Test
	void includeWithoutRulesReturnsAllSavedAttractions() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "false")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(body)).containsExactly(
				"poi-zhu-a", "poi-zhu-b", "poi-zhu-c", "poi-zhu-d", "poi-zhu-e");
		assertThat(poiIds(body)).doesNotContain("poi-zhu-hotel");
		assertThat(item(body, "poi-zhu-b").path("maxPetsPerPerson").asInt()).isZero();
		assertThat(isNullOrMissing(item(body, "poi-zhu-c").path("maxPetsPerPerson"))).isTrue();
	}

	@Test
	void listItemsCarryFullPetPoliciesAndKeepExistingFields() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "false")
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
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.with(user("demo").roles("USER")));

		assertThat(item(body, "poi-zhu-a").path("petPolicies").path("maxSinglePetWeightKg").asDouble())
			.isEqualTo(8.5);
		assertThat(item(body, "poi-zhu-e").path("petPolicies").path("allowedPetTypes").asString())
			.isEqualTo("CAT,DOG");
		assertThat(item(body, "poi-zhu-e").path("petPolicies").path("extraFeeCents").asLong()).isZero();
	}

	@Test
	void regionPrefixMatchesDistrictRegionCodes() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.with(user("demo").roles("USER")));

		assertThat(item(body, "poi-zhu-a").path("regionCode").asString()).isEqualTo("440402");
		assertThat(item(body, "poi-zhu-e").path("regionCode").asString()).isEqualTo("440400");
	}

	@Test
	void paginatesInIdOrder() throws Exception {
		JsonNode first = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.param("page", "1")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));
		JsonNode second = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.param("page", "2")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(first)).containsExactly("poi-zhu-a");
		assertThat(first.path("hasNext").asBoolean()).isTrue();
		assertThat(poiIds(second)).containsExactly("poi-zhu-e");
		assertThat(first.path("totalElements").asLong()).isEqualTo(2);
	}

	@Test
	void sharedListFiltersEveryLocationTypeAndPreservesTheUnifiedSummary() throws Exception {
		for (String typeGroup : List.of("attraction", "hotel", "pet-hospital", "pet-supplies", "restaurant")) {
			JsonNode body = json(get("/api/locations")
					.param("regionCode", "440400")
					.param("typeGroup", typeGroup)
					.with(user("demo").roles("USER")));

			assertThat(poiIds(body)).isNotEmpty();
			for (JsonNode location : body.path("items")) {
				assertThat(location.path("typeGroup").asString()).isEqualTo(typeGroup);
			}
		}

		JsonNode summary = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.with(user("demo").roles("USER")));
		JsonNode first = item(summary, "poi-zhu-a");
		assertThat(first.has("longitude")).isTrue();
		assertThat(first.has("latitude")).isTrue();
		assertThat(first.has("minVisitHours")).isTrue();
		assertThat(first.has("maxVisitHours")).isTrue();
		assertThat(first.path("petPolicies").path("allowedPetTypes").asString()).isEqualTo("DOG");
	}

	@Test
	void sharedListSupportsProvinceCityFriendlyFiltersAndPaging() throws Exception {
		JsonNode provinceHotels = json(get("/api/locations")
				.param("regionCode", "440000")
				.param("typeGroup", "hotel")
				.with(user("demo").roles("USER")));
		JsonNode cityHotels = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "hotel")
				.with(user("demo").roles("USER")));
		JsonNode friendlyHotels = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "hotel")
				.param("petFriendlyOnly", "true")
				.with(user("demo").roles("USER")));
		JsonNode firstPage = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.param("page", "1")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));
		JsonNode secondPage = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.param("page", "2")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(provinceHotels)).containsExactly("poi-zhu-hotel", "poi-zhu-hotel-no-policy");
		assertThat(poiIds(cityHotels)).containsExactly("poi-zhu-hotel", "poi-zhu-hotel-no-policy");
		assertThat(poiIds(friendlyHotels)).containsExactly("poi-zhu-hotel");
		assertThat(poiIds(firstPage)).containsExactly("poi-zhu-a");
		assertThat(poiIds(secondPage)).containsExactly("poi-zhu-e");
		assertThat(firstPage.path("hasNext").asBoolean()).isTrue();
		assertThat(firstPage.path("totalElements").asLong()).isEqualTo(2);

		JsonNode allAdminLocations = json(get("/api/locations").with(user("admin").roles("ADMIN")));
		assertThat(poiIds(allAdminLocations)).contains("poi-zhu-a", "poi-zhu-hotel", "poi-zhu-hospital",
				"poi-zhu-supplies", "poi-zhu-restaurant", "poi-hz-hotel");
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
	void detailReturnsMapCardSummaryFields() throws Exception {
		PawtripLocation card = new PawtripLocation("poi-card", "卡片酒店", "100000", "hotel", "情侣路",
				113.5, 22.1, "440402",
				"""
				{"photos":[{"url":"http://example.com/a.jpg"},{"url":"https://example.com/b.jpg","title":"大堂"}]}
				""",
				"""
				{"rating":4.6,"keytag":"宠物友好","business_area":"情侣路"}
				""", null, null);
		card.updatePetPolicies("CAT,DOG", 1, 15.0, 45.0, true, false, 30000L, false);
		this.locationRepository.save(card);

		JsonNode body = json(get("/api/locations/poi-card").with(user("demo").roles("USER")));

		assertThat(body.path("coverPhotoUrl").asString()).isEqualTo("https://example.com/b.jpg");
		assertThat(body.path("rating").asString()).isEqualTo("4.6");
		assertThat(body.path("keytag").asString()).isEqualTo("宠物友好");
		assertThat(body.path("businessArea").asString()).isEqualTo("情侣路");
		assertThat(body.has("photos")).isFalse();
		assertThat(body.has("business")).isFalse();
		assertThat(body.has("poi")).isFalse();
	}

	@Test
	void unauthenticatedRequestsReturn401() throws Exception {
		this.mockMvc.perform(get("/api/locations").param("regionCode", "440400"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void dedicatedAttractionListRouteIsRemoved() throws Exception {
		this.mockMvc.perform(get("/api/locations/attractions")
					.param("regionCode", "440400")
					.with(user("demo").roles("USER")))
				.andExpect(status().isNotFound());
	}

	@Test
	void unknownPoiIdReturns404() throws Exception {
		this.mockMvc.perform(get("/api/locations/missing").with(user("demo").roles("USER")))
				.andExpect(status().isNotFound());
	}

	@Test
	void invalidRegionAndPagingReturn400() throws Exception {
		for (MockHttpServletRequestBuilder request : List.of(
				get("/api/locations"),
				get("/api/locations").param("regionCode", "abc"),
				get("/api/locations").param("regionCode", "999999"),
				get("/api/locations").param("regionCode", "440400").param("page", "0"),
				get("/api/locations").param("regionCode", "440400").param("pageSize", "101"),
				get("/api/locations").param("regionCode", "440400").param("typeGroup", "unknown"))) {
			this.mockMvc.perform(request.with(user("demo").roles("USER")))
					.andExpect(status().isBadRequest());
		}
	}

	@Test
	void readsOnlyDatabaseWithoutCallingAmap() throws Exception {
		json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "true")
				.with(user("demo").roles("USER")));
		json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "hotel")
				.with(user("demo").roles("USER")));
		json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "restaurant")
				.param("nearPoiId", "poi-zhu-a")
				.with(user("demo").roles("USER")));
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
		this.mockMvc.perform(post("/api/locations")
						.with(user("demo").roles("USER"))
						.with(csrf()))
				.andExpect(status().isMethodNotAllowed());
	}

	@Test
	void listItemsCarryFirstCoverPhotoAndRatingSnapshot() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "false")
				.with(user("demo").roles("USER")));

		JsonNode rated = item(body, "poi-zhu-a");
		assertThat(rated.path("coverPhotoUrl").asString()).isEqualTo("https://photos.example/a-0.png");
		assertThat(rated.path("rating").asString()).isEqualTo("4.6");

		JsonNode plain = item(body, "poi-zhu-e");
		assertThat(plain.path("coverPhotoUrl").isNull()).isTrue();
		assertThat(plain.path("rating").isNull()).isTrue();
	}

	@Test
	void listFallsBackToPoiPhotosWhenNoSavedCoverExists() throws Exception {
		PawtripLocation card = new PawtripLocation("poi-list-fallback", "快照酒店", "100000", "hotel", "情侣路",
				113.5, 22.1, "440402",
				"""
				{"photos":[{"url":"http://example.com/a.jpg"},{"url":"https://example.com/b.jpg","title":"大堂"}]}
				""", "{}", null, null);
		this.locationRepository.save(card);

		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "hotel")
				.param("petFriendlyOnly", "false")
				.with(user("demo").roles("USER")));

		assertThat(item(body, "poi-list-fallback").path("coverPhotoUrl").asString())
				.isEqualTo("https://example.com/b.jpg");
	}

	@Test
	void detailCarriesCoverPhotoAndRatingOrNulls() throws Exception {
		JsonNode rated = json(get("/api/locations/poi-zhu-a").with(user("demo").roles("USER")));
		assertThat(rated.path("coverPhotoUrl").asString()).isEqualTo("https://photos.example/a-0.png");
		assertThat(rated.path("rating").asString()).isEqualTo("4.6");

		JsonNode plain = json(get("/api/locations/poi-zhu-d").with(user("demo").roles("USER")));
		assertThat(plain.path("coverPhotoUrl").isNull()).isTrue();
		assertThat(plain.path("rating").isNull()).isTrue();
	}

	@Test
	void blankOrInvalidRatingSnapshotBecomesNull() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "330100")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "false")
				.with(user("demo").roles("USER")));

		assertThat(item(body, "poi-hz-blank").path("rating").isNull()).isTrue();
		assertThat(item(body, "poi-hz-bad").path("rating").isNull()).isTrue();
		assertThat(item(body, "poi-hz-a").path("rating").isNull()).isTrue();
	}

	@Test
	void userMediaResponsesDoNotExposeAdminOnlyFields() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "attraction")
				.param("petFriendlyOnly", "false")
				.with(user("demo").roles("USER")));

		for (JsonNode item : body.path("items")) {
			assertThat(item.has("photos")).isFalse();
			assertThat(item.has("business")).isFalse();
			assertThat(item.has("poi")).isFalse();
		}
	}

	@Test
	void nearbyFilterReturnsOnlyLocationsWithinFiveKmSortedByDistance() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "restaurant")
				.param("petFriendlyOnly", "false")
				.param("nearPoiId", "poi-zhu-a")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(body)).containsExactly("poi-zhu-restaurant-close", "poi-zhu-restaurant");
		assertThat(item(body, "poi-zhu-restaurant-close").path("distanceMeters").asLong()).isBetween(50L, 70L);
		assertThat(item(body, "poi-zhu-restaurant").path("distanceMeters").asLong()).isBetween(200L, 250L);
		assertThat(poiIds(body)).doesNotContain("poi-zhu-restaurant-far", "poi-zhu-restaurant-null");
		assertThat(body.path("totalElements").asLong()).isEqualTo(2);
	}

	@Test
	void nearbyFilterCombinesWithPetFriendlyFilterAndPagination() throws Exception {
		JsonNode friendly = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "restaurant")
				.param("petFriendlyOnly", "true")
				.param("nearPoiId", "poi-zhu-a")
				.with(user("demo").roles("USER")));
		JsonNode firstPage = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "restaurant")
				.param("petFriendlyOnly", "false")
				.param("nearPoiId", "poi-zhu-a")
				.param("page", "1")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));
		JsonNode secondPage = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "restaurant")
				.param("petFriendlyOnly", "false")
				.param("nearPoiId", "poi-zhu-a")
				.param("page", "2")
				.param("pageSize", "1")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(friendly)).containsExactly("poi-zhu-restaurant");
		assertThat(poiIds(firstPage)).containsExactly("poi-zhu-restaurant-close");
		assertThat(firstPage.path("totalElements").asLong()).isEqualTo(2);
		assertThat(firstPage.path("hasNext").asBoolean()).isTrue();
		assertThat(poiIds(secondPage)).containsExactly("poi-zhu-restaurant");
		assertThat(secondPage.path("hasPrevious").asBoolean()).isTrue();
	}

	@Test
	void nearbyFilterSupportsHotelsAndRejectsInvalidAnchors() throws Exception {
		JsonNode hotels = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "hotel")
				.param("nearPoiId", "poi-zhu-a")
				.with(user("demo").roles("USER")));

		assertThat(poiIds(hotels)).containsExactly("poi-zhu-hotel");

		for (String nearPoiId : List.of("missing", "poi-zhu-hotel", "poi-zhu-c")) {
			this.mockMvc.perform(get("/api/locations")
						.param("regionCode", "440400")
						.param("nearPoiId", nearPoiId)
						.with(user("demo").roles("USER")))
				.andExpect(status().isBadRequest());
		}
	}

	@Test
	void adminSharedListGainsMediaScalarsAndAdminDetailKeepsFullData() throws Exception {
		JsonNode body = json(get("/api/locations").with(user("admin").roles("ADMIN")));
		assertThat(item(body, "poi-zhu-a").has("coverPhotoUrl")).isTrue();
		assertThat(item(body, "poi-zhu-a").has("rating")).isTrue();

		JsonNode adminDetail = json(get("/api/admin/locations/poi-zhu-a").with(user("admin").roles("ADMIN")));
		assertThat(adminDetail.has("photos")).isTrue();
		assertThat(adminDetail.has("business")).isTrue();
		assertThat(adminDetail.has("poi")).isTrue();
	}

	@Test
	void databaseListOmitsDistanceMetersWithoutAnchor() throws Exception {
		JsonNode body = json(get("/api/locations")
				.param("regionCode", "440400")
				.param("typeGroup", "restaurant")
				.with(user("demo").roles("USER")));

		assertThat(isNullOrMissing(item(body, "poi-zhu-restaurant").path("distanceMeters"))).isTrue();
	}

	@Test
	void haversineDistanceIsMetersAndHandlesBoundaryOffset() {
		assertThat(LocationQueryService.distanceMeters(22.1, 113.5, 22.1, 113.5)).isZero();
		assertThat(LocationQueryService.distanceMeters(22.1, 113.5, 22.144969, 113.5))
			.isCloseTo(5_000.0, within(2.0));
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
		return location(poiId, name, typeGroup, regionCode, typeCode, maxPetsPerPerson, allowedPetTypes, maxWeight,
				maxShoulderHeight, leashRequired, vaccinationProofRequired, extraFeeCents, reservationRequired, "{}");
	}

	private static PawtripLocation location(String poiId, String name, String typeGroup, String regionCode,
			String typeCode, Integer maxPetsPerPerson, String allowedPetTypes, Double maxWeight,
			Double maxShoulderHeight, Boolean leashRequired, Boolean vaccinationProofRequired, Long extraFeeCents,
			Boolean reservationRequired, String businessJson) {
		PawtripLocation location = new PawtripLocation(poiId, name, typeCode, typeGroup, "测试地址", null, null,
				regionCode, "{}", businessJson, null, null);
		location.updatePetPolicies(allowedPetTypes, maxPetsPerPerson, maxWeight, maxShoulderHeight, leashRequired,
				vaccinationProofRequired, extraFeeCents, reservationRequired);
		return location;
	}

	private static PawtripLocation locationAt(String poiId, String name, String typeGroup, String regionCode,
			String typeCode, Double longitude, Double latitude, Integer maxPetsPerPerson, String allowedPetTypes,
			Double maxWeight, Double maxShoulderHeight, Boolean leashRequired, Boolean vaccinationProofRequired,
			Long extraFeeCents, Boolean reservationRequired) {
		return locationAt(poiId, name, typeGroup, regionCode, typeCode, longitude, latitude, maxPetsPerPerson,
				allowedPetTypes, maxWeight, maxShoulderHeight, leashRequired, vaccinationProofRequired, extraFeeCents,
				reservationRequired, "{}");
	}

	private static PawtripLocation locationAt(String poiId, String name, String typeGroup, String regionCode,
			String typeCode, Double longitude, Double latitude, Integer maxPetsPerPerson, String allowedPetTypes,
			Double maxWeight, Double maxShoulderHeight, Boolean leashRequired, Boolean vaccinationProofRequired,
			Long extraFeeCents, Boolean reservationRequired, String businessJson) {
		PawtripLocation location = new PawtripLocation(poiId, name, typeCode, typeGroup, "测试地址", longitude, latitude,
				regionCode, "{}", businessJson, null, null);
		location.updatePetPolicies(allowedPetTypes, maxPetsPerPerson, maxWeight, maxShoulderHeight, leashRequired,
				vaccinationProofRequired, extraFeeCents, reservationRequired);
		return location;
	}

	private static PawtripLocation locationWithBusiness(String poiId, String name, String regionCode,
			String businessJson) {
		return location(poiId, name, "attraction", regionCode, "110000", null, null, null, null, null, null, null,
				null, businessJson);
	}

}
