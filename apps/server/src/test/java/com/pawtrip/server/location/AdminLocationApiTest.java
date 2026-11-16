package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pawtrip.server.application.model.maps.PlaceSearchResult;
import com.pawtrip.server.application.model.maps.PlaceTypeSearchRequest;
import com.pawtrip.server.application.port.maps.PlaceSearchPort;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
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
class AdminLocationApiTest {

	private static final Path DB_PATH = Path.of("target", "admin-location-api-test.db");
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
	AdministrativeRegionRepository regionRepository;

	@Autowired
	LocationPhotoRepository photoRepository;

	@MockitoBean
	PlaceSearchPort placeSearchPort;

	@BeforeEach
	void clearLocations() {
		this.photoRepository.deleteAll();
		this.locationRepository.deleteAll();
	}

	@Test
	void returnsAdministrativeTreeAndTypeGroups() throws Exception {
		MvcResult regionsResult = this.mockMvc.perform(get("/api/admin/regions").with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode regions = JSON_MAPPER.readTree(regionsResult.getResponse().getContentAsString());
		JsonNode zhejiang = findRegion(regions, "330000");
		assertThat(zhejiang.path("name").asString()).isEqualTo("浙江省");
		assertThat(findRegion(zhejiang.path("children"), "330100").path("level").asString()).isEqualTo("city");
		assertThat(hasProvinceLeaf(regions)).isTrue();

		this.mockMvc.perform(get("/api/admin/location-types").with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].key").value("attraction"))
				.andExpect(jsonPath("$[0].label").value("景点"))
				.andExpect(jsonPath("$[0].typeCodes[0]").value("110000"))
				.andExpect(jsonPath("$[1].key").value("hotel"))
				.andExpect(jsonPath("$[1].label").value("住宿"))
				.andExpect(jsonPath("$[1].typeCodes[0]").value("100000"))
				.andExpect(jsonPath("$[2].key").value("pet-hospital"))
				.andExpect(jsonPath("$[2].label").value("宠物医院"))
				.andExpect(jsonPath("$[2].typeCodes[0]").value("090700"))
				.andExpect(jsonPath("$[3].key").value("pet-supplies"))
				.andExpect(jsonPath("$[3].label").value("宠物用品店"))
				.andExpect(jsonPath("$[3].typeCodes[0]").value("061211"))
				.andExpect(jsonPath("$[4].key").value("restaurant"))
				.andExpect(jsonPath("$[4].label").value("餐厅"))
				.andExpect(jsonPath("$[4].typeCodes[0]").value("050000"));
	}

	@Test
	void amapSearchUsesTypeCodesOfSelectedGroup() throws Exception {
		given(this.placeSearchPort.searchByTypes(any()))
				.willReturn(new PlaceSearchResult(0, 1, 10, List.of()));

		for (String typeGroup : List.of("hotel", "pet-hospital", "pet-supplies", "restaurant")) {
			this.mockMvc.perform(get("/api/admin/locations/amap")
						.with(user("admin").roles("ADMIN"))
						.param("typeGroup", typeGroup))
					.andExpect(status().isOk());
		}

		var request = org.mockito.ArgumentCaptor.forClass(PlaceTypeSearchRequest.class);
		org.mockito.Mockito.verify(this.placeSearchPort, org.mockito.Mockito.times(4))
				.searchByTypes(request.capture());
		assertThat(request.getAllValues()).extracting(value -> value.typeCodes().get(0))
				.containsExactly("100000", "090700", "061211", "050000");
	}

	@Test
	void amapSearchKeepsOnlyPoisWhosePrimaryTypeMatchesTheGroup() throws Exception {
		JsonNode restaurantWithHotelCategory = JSON_MAPPER.readTree("""
				{"id":"poi-restaurant","name":"Restaurant","typecode":"050101|100100","address":"Shanghai"}
				""");
		JsonNode hotelWithRestaurantCategory = JSON_MAPPER.readTree("""
				{"id":"poi-hotel","name":"Hotel","typecode":"100102|050000","address":"Shanghai"}
				""");

		given(this.placeSearchPort.searchByTypes(any()))
				.willReturn(new PlaceSearchResult(2, 1, 10, List.of(restaurantWithHotelCategory, hotelWithRestaurantCategory)));
		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "hotel"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].poiId").value("poi-hotel"));

		given(this.placeSearchPort.searchByTypes(any()))
				.willReturn(new PlaceSearchResult(2, 1, 10, List.of(hotelWithRestaurantCategory, restaurantWithHotelCategory)));
		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "restaurant"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].poiId").value("poi-restaurant"));
	}

	@Test
	void amapSearchScansFurtherPagesUntilTheRequestedPageIsFilled() throws Exception {
		List<JsonNode> firstAmapPage = new java.util.ArrayList<>();
		for (int index = 0; index < 24; index++) {
			firstAmapPage.add(JSON_MAPPER.readTree(
					"{\"id\":\"poi-restaurant-" + index + "\",\"name\":\"Restaurant\",\"typecode\":\"050101|100100\"}"));
		}
		firstAmapPage.add(JSON_MAPPER.readTree(
				"{\"id\":\"poi-hotel-1\",\"name\":\"Hotel 1\",\"typecode\":\"100100\"}"));
		JsonNode secondAmapPageHotel = JSON_MAPPER.readTree(
				"{\"id\":\"poi-hotel-2\",\"name\":\"Hotel 2\",\"typecode\":\"100101\"}");

		given(this.placeSearchPort.searchByTypes(any()))
				.willReturn(new PlaceSearchResult(0, 1, 25, List.copyOf(firstAmapPage)))
				.willReturn(new PlaceSearchResult(0, 2, 25, List.of(secondAmapPageHotel)));

		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "hotel")
					.param("page", "1")
					.param("pageSize", "2"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(2))
				.andExpect(jsonPath("$.items[0].poiId").value("poi-hotel-1"))
				.andExpect(jsonPath("$.items[1].poiId").value("poi-hotel-2"));

		var request = org.mockito.ArgumentCaptor.forClass(PlaceTypeSearchRequest.class);
		org.mockito.Mockito.verify(this.placeSearchPort, org.mockito.Mockito.times(2))
				.searchByTypes(request.capture());
		assertThat(request.getAllValues()).extracting(PlaceTypeSearchRequest::pageNum).containsExactly(1, 2);
	}

	@Test
	void amapPageMarksSavedCandidatesWithoutHidingThem() throws Exception {
		this.locationRepository.saveAndFlush(location("poi-saved", "330106", "attraction"));
		JsonNode savedPoi = JSON_MAPPER.readTree("""
				{"id":"poi-saved","name":"Saved Park","typecode":"110000","address":"Hangzhou","adcode":"330106","future":{"value":true}}
				""");
		JsonNode newPoi = JSON_MAPPER.readTree("""
				{"id":"poi-new","name":"New Park","typecode":"110000","address":"Hangzhou","adcode":"330106"}
				""");
		given(this.placeSearchPort.searchByTypes(any()))
				.willReturn(new PlaceSearchResult(0, 1, 25, List.of(savedPoi, newPoi)));

		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("regionCode", "330100")
					.param("typeGroup", "attraction")
					.param("page", "1")
					.param("pageSize", "2"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.page").value(1))
				.andExpect(jsonPath("$.pageSize").value(2))
				.andExpect(jsonPath("$.items.length()").value(2))
				.andExpect(jsonPath("$.items[0].poiId").value("poi-saved"))
				.andExpect(jsonPath("$.items[0].saved").value(true))
				.andExpect(jsonPath("$.items[0].poi.future.value").value(true))
				.andExpect(jsonPath("$.items[1].poiId").value("poi-new"))
				.andExpect(jsonPath("$.items[1].saved").value(false))
				.andExpect(jsonPath("$.hasNext").value(false))
				.andExpect(jsonPath("$.hasPrevious").value(false));

		var request = org.mockito.ArgumentCaptor.forClass(PlaceTypeSearchRequest.class);
		verify(this.placeSearchPort).searchByTypes(request.capture());
		assertThat(request.getValue().typeCodes()).containsExactly("110000");
		assertThat(request.getValue().regionCode()).isEqualTo("330100");
		assertThat(request.getValue().pageNum()).isEqualTo(1);
		assertThat(request.getValue().pageSize()).isEqualTo(25);
	}

	@Test
	void amapSearchRejectsPagesBeyondTheTwoHundredResultLimit() throws Exception {
		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "attraction")
					.param("page", "9")
					.param("pageSize", "25"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		org.mockito.Mockito.verifyNoInteractions(this.placeSearchPort);
	}

	@Test
	void amapRegionMayBeProvinceLeafOrCityAndUnknownFiltersAreRejected() throws Exception {
		given(this.placeSearchPort.searchByTypes(any()))
				.willReturn(new PlaceSearchResult(0, 1, 10, List.of()));

		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("regionCode", "110000")
					.param("typeGroup", "attraction"))
				.andExpect(status().isOk());
		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("regionCode", "330100")
					.param("typeGroup", "attraction"))
				.andExpect(status().isOk());

		var request = org.mockito.ArgumentCaptor.forClass(PlaceTypeSearchRequest.class);
		org.mockito.Mockito.verify(this.placeSearchPort, org.mockito.Mockito.times(2))
				.searchByTypes(request.capture());
		assertThat(request.getAllValues()).extracting(PlaceTypeSearchRequest::regionCode)
				.containsExactly("110000", "330100");

		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("regionCode", "999999")
					.param("typeGroup", "attraction"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "untrusted-type-code"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		org.mockito.Mockito.verifyNoMoreInteractions(this.placeSearchPort);
	}

	@Test
	void savedLocationsUseDatabaseFilteringAndPagingWithoutCallingAmap() throws Exception {
		this.locationRepository.saveAllAndFlush(List.of(
				location("poi-hangzhou", "330106", "attraction"),
				location("poi-ningbo", "330205", "attraction"),
				location("poi-hefei", "340105", "attraction"),
				location("poi-hotel", "330106", "hotel")));

		this.mockMvc.perform(get("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.param("regionCode", "330000")
					.param("typeGroup", "attraction")
					.param("page", "1")
					.param("pageSize", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.page").value(1))
				.andExpect(jsonPath("$.pageSize").value(1))
				.andExpect(jsonPath("$.totalElements").value(2))
				.andExpect(jsonPath("$.totalPages").value(2))
				.andExpect(jsonPath("$.hasNext").value(true))
				.andExpect(jsonPath("$.items[0].poiId").value("poi-hangzhou"))
				.andExpect(jsonPath("$.items[0].petPolicies").doesNotExist());

		this.mockMvc.perform(get("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.param("regionCode", "330100")
					.param("typeGroup", "attraction")
					.param("page", "1")
					.param("pageSize", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(1))
				.andExpect(jsonPath("$.items[0].poiId").value("poi-hangzhou"));

		verifyNoInteractions(this.placeSearchPort);
	}

	@Test
	void firstSavePersistsPhotoSourceUrlWithoutFetchingAndSavedDetailIsDatabaseOnly() throws Exception {
		given(this.placeSearchPort.getPlaceById("poi-first-save")).willReturn(JSON_MAPPER.readTree("""
				{"id":"poi-first-save","name":"Lake Park","typecode":"110201","address":"Hangzhou","location":"120.1,30.2","adcode":"330106","business":{"rating":"4.8","future":{"open":true}},"photos":[{"title":"Main gate","url":"https://img.example.test/gate.jpg","future":{"rank":3}}],"future_field":{"retained":true}}
				"""));

		this.mockMvc.perform(post("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"poiId":"poi-first-save","typeGroup":"attraction","minVisitHours":2,"maxVisitHours":5}
						"""))
				.andExpect(status().isCreated())
				.andExpect(header().string("Location", "/api/admin/locations/poi-first-save"))
				.andExpect(jsonPath("$.poi.future_field.retained").value(true))
				.andExpect(jsonPath("$.business.future.open").value(true))
				.andExpect(jsonPath("$.minVisitHours").value(2))
				.andExpect(jsonPath("$.photos.length()").value(1))
				.andExpect(jsonPath("$.photos[0].sourceUrl").value("https://img.example.test/gate.jpg"))
				.andExpect(jsonPath("$.photos[0].metadata.future.rank").value(3));

		this.mockMvc.perform(get("/api/admin/locations/poi-first-save").with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.poiId").value("poi-first-save"))
				.andExpect(jsonPath("$.business.rating").value("4.8"))
				.andExpect(jsonPath("$.photos[0].metadata.title").value("Main gate"));

		this.mockMvc.perform(get("/api/admin/locations/poi-first-save/photos/1")
					.with(user("admin").roles("ADMIN")))
				.andExpect(status().isNotFound());
		this.mockMvc.perform(post("/api/admin/locations/poi-first-save/photos/retry")
					.with(user("admin").roles("ADMIN"))
					.with(csrf()))
				.andExpect(status().isNotFound());

		verify(this.placeSearchPort).getPlaceById("poi-first-save");
		org.mockito.Mockito.verifyNoMoreInteractions(this.placeSearchPort);
	}


	@Test
	void upstreamDetailFailureLeavesNoPartialLocation() throws Exception {
		given(this.placeSearchPort.getPlaceById("poi-failed-save"))
				.willThrow(new com.pawtrip.server.application.model.maps.PlaceSearchException(
						com.pawtrip.server.application.model.maps.PlaceSearchException.Code.UPSTREAM_FAILURE,
						"sensitive upstream message"));

		this.mockMvc.perform(post("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"poiId":"poi-failed-save","typeGroup":"attraction"}
						"""))
				.andExpect(status().isBadGateway())
				.andExpect(jsonPath("$.code").value("UPSTREAM_FAILURE"))
				.andExpect(jsonPath("$.detail").value("Map service request failed"));

		assertThat(this.locationRepository.existsByPoiId("poi-failed-save")).isFalse();
		assertThat(this.photoRepository.count()).isZero();
	}

	@Test
	void duplicateCreateConflictsAndInvalidVisitHoursAreRejectedBeforeAmapCall() throws Exception {
		this.locationRepository.saveAndFlush(location("poi-already-saved", null, "attraction"));
		this.mockMvc.perform(post("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"poiId":"poi-already-saved","typeGroup":"attraction"}
						"""))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("LOCATION_CONFLICT"));

		this.mockMvc.perform(post("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"poiId":"poi-negative-hours","typeGroup":"attraction","minVisitHours":-1}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		this.mockMvc.perform(post("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"poiId":"poi-inverted-hours","typeGroup":"attraction","minVisitHours":5,"maxVisitHours":2}
						"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		verifyNoInteractions(this.placeSearchPort);
	}

	@Test
	void editingKeepsDatabasePageOrderAndDoesNotCallAmap() throws Exception {
		this.locationRepository.saveAllAndFlush(List.of(
				location("poi-order-1", null, "attraction"),
				location("poi-order-2", null, "attraction"),
				location("poi-order-3", null, "attraction")));

		this.mockMvc.perform(get("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "attraction")
					.param("page", "2")
					.param("pageSize", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].poiId").value("poi-order-2"))
				.andExpect(jsonPath("$.totalElements").value(3));

		this.mockMvc.perform(patch("/api/admin/locations/poi-order-2")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"minVisitHours":3,"maxVisitHours":4}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.minVisitHours").value(3))
				.andExpect(jsonPath("$.maxVisitHours").value(4));

		this.mockMvc.perform(get("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "attraction")
					.param("page", "2")
					.param("pageSize", "1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].poiId").value("poi-order-2"))
				.andExpect(jsonPath("$.totalElements").value(3))
				.andExpect(jsonPath("$.page").value(2));

		verifyNoInteractions(this.placeSearchPort);
	}

	@Test
	void rejectsInvalidPagination() throws Exception {
		this.mockMvc.perform(get("/api/admin/locations/amap")
					.with(user("admin").roles("ADMIN"))
					.param("typeGroup", "attraction")
					.param("page", "9")
					.param("pageSize", "25"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		verifyNoInteractions(this.placeSearchPort);
	}

	@Test
	void createsLocationWithPetPoliciesAndDetailReturnsThem() throws Exception {
		given(this.placeSearchPort.getPlaceById("poi-policy-create")).willReturn(JSON_MAPPER.readTree("""
				{"id":"poi-policy-create","name":"Policy Park","typecode":"110000","address":"Hangzhou","location":"120.1,30.2","adcode":"330106","business":{},"photos":[]}
				"""));

		this.mockMvc.perform(post("/api/admin/locations")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"poiId":"poi-policy-create","typeGroup":"attraction","petPolicies":{
							  "maxPetsPerPerson":1,"maxSinglePetWeightKg":8.75,"leashRequired":true,
							  "vaccinationProofRequired":false,"extraFeeCents":1050,"reservationRequired":null}}
							"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(1))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetWeightKg").value(8.75))
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(true))
				.andExpect(jsonPath("$.petPolicies.vaccinationProofRequired").value(false))
				.andExpect(jsonPath("$.petPolicies.extraFeeCents").value(1050))
				.andExpect(jsonPath("$.petPolicies.reservationRequired").value(nullValue()));

		this.mockMvc.perform(get("/api/admin/locations/poi-policy-create").with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(1))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetWeightKg").value(8.75))
				.andExpect(jsonPath("$.petPolicies.extraFeeCents").value(1050));
	}

	@Test
	void updatesPetPoliciesOnlyWhenProvidedAndAllowsClearing() throws Exception {
		var location = location("poi-policy-patch", "330106", "attraction");
		location.updatePetPolicies("DOG", 2, 10.5, 40.0, true, false, 500L, true);
		this.locationRepository.saveAndFlush(location);

		this.mockMvc.perform(patch("/api/admin/locations/poi-policy-patch")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"minVisitHours":3,"maxVisitHours":4}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.minVisitHours").value(3))
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(2))
				.andExpect(jsonPath("$.petPolicies.extraFeeCents").value(500));

		this.mockMvc.perform(patch("/api/admin/locations/poi-policy-patch")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":null}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(true));

		this.mockMvc.perform(patch("/api/admin/locations/poi-policy-patch")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"maxPetsPerPerson":0,"maxSinglePetWeightKg":0,"leashRequired":false,
							  "vaccinationProofRequired":true,"extraFeeCents":0,"reservationRequired":false}}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(0))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetWeightKg").value(0.0))
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(false))
				.andExpect(jsonPath("$.petPolicies.vaccinationProofRequired").value(true))
				.andExpect(jsonPath("$.petPolicies.extraFeeCents").value(0))
				.andExpect(jsonPath("$.petPolicies.reservationRequired").value(false));

		this.mockMvc.perform(patch("/api/admin/locations/poi-policy-patch")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"maxPetsPerPerson":null,"maxSinglePetWeightKg":null,"leashRequired":null,
							  "vaccinationProofRequired":null,"extraFeeCents":null,"reservationRequired":null}}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetWeightKg").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.extraFeeCents").value(nullValue()));

		var persisted = this.locationRepository.findByPoiId("poi-policy-patch").orElseThrow();
		assertThat(persisted.getAllowedPetTypes()).isEqualTo("DOG");
		assertThat(persisted.getMaxSinglePetShoulderHeightCm()).isEqualTo(40.0);
	}

	@Test
	void rejectsInvalidPetPoliciesWithoutWriting() throws Exception {
		for (String body : List.of(
				"""
						{"poiId":"poi-invalid-pets","typeGroup":"attraction","petPolicies":{"maxPetsPerPerson":-1}}
						""",
				"""
						{"poiId":"poi-invalid-pets-fraction","typeGroup":"attraction","petPolicies":{"maxPetsPerPerson":1.5}}
						""",
				"""
						{"poiId":"poi-invalid-weight","typeGroup":"attraction","petPolicies":{"maxSinglePetWeightKg":8.751}}
						""",
				"""
						{"poiId":"poi-invalid-fee","typeGroup":"attraction","petPolicies":{"extraFeeCents":-1}}
						""",
				"""
						{"poiId":"poi-invalid-fee-fraction","typeGroup":"attraction","petPolicies":{"extraFeeCents":10.5}}
						""")) {
			this.mockMvc.perform(post("/api/admin/locations")
						.with(user("admin").roles("ADMIN"))
						.with(csrf())
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		verifyNoInteractions(this.placeSearchPort);
		assertThat(this.locationRepository.count()).isZero();

		var location = location("poi-policy-invalid-update", "330106", "attraction");
		location.updatePetPolicies("DOG", 1, 8.0, 40.0, true, true, 100L, false);
		this.locationRepository.saveAndFlush(location);

		this.mockMvc.perform(patch("/api/admin/locations/poi-policy-invalid-update")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"maxSinglePetWeightKg":8.751}}
							"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		this.mockMvc.perform(patch("/api/admin/locations/poi-policy-invalid-update")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"extraFeeCents":-1}}
							"""))
				.andExpect(status().isBadRequest());

		this.mockMvc.perform(get("/api/admin/locations/poi-policy-invalid-update")
					.with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(1))
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(true));
	}

	@Test
	void updatingLocationPoliciesDoesNotChangeRegionPolicies() throws Exception {
		var regionBefore = this.regionRepository.findById("330000").orElseThrow();
		assertThat(regionBefore.getMaxPetsPerPerson()).isNull();
		assertThat(regionBefore.getExtraFeeCents()).isNull();

		this.locationRepository.saveAndFlush(location("poi-region-independent", "330106", "attraction"));
		this.mockMvc.perform(patch("/api/admin/locations/poi-region-independent")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"maxPetsPerPerson":2,"maxSinglePetWeightKg":6.5,"leashRequired":true,
							  "vaccinationProofRequired":false,"extraFeeCents":300,"reservationRequired":true}}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(2));

		var regionAfter = this.regionRepository.findById("330000").orElseThrow();
		assertThat(regionAfter.getMaxPetsPerPerson()).isNull();
		assertThat(regionAfter.getMaxSinglePetWeightKg()).isNull();
		assertThat(regionAfter.getLeashRequired()).isNull();
		assertThat(regionAfter.getVaccinationProofRequired()).isNull();
		assertThat(regionAfter.getExtraFeeCents()).isNull();
		assertThat(regionAfter.getReservationRequired()).isNull();
	}

	@Test
	void updatesPetPoliciesForNonAttractionLocations() throws Exception {
		this.locationRepository.saveAndFlush(location("poi-hotel-policy", "330106", "hotel"));

		this.mockMvc.perform(patch("/api/admin/locations/poi-hotel-policy")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"maxPetsPerPerson":1,"maxSinglePetWeightKg":5.5,"leashRequired":true,
							  "vaccinationProofRequired":false,"extraFeeCents":100,"reservationRequired":false}}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(1))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetWeightKg").value(5.5))
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(true));
	}

	private static boolean hasProvinceLeaf(JsonNode regions) {
		for (JsonNode region : regions) {
			if ("province".equals(region.path("level").asString()) && region.path("children").isEmpty()) {
				return true;
			}
		}
		return false;
	}

	private static JsonNode findRegion(JsonNode regions, String adcode) {
		for (JsonNode region : regions) {
			if (adcode.equals(region.path("adcode").asString())) {
				return region;
			}
		}
		throw new AssertionError("Region not found: " + adcode);
	}

	private static PawtripLocation location(String poiId, String regionCode, String typeGroup) {
		return new PawtripLocation(
				poiId,
				poiId,
				typeGroup.equals("attraction") ? "110000" : "050000",
				typeGroup,
				null,
				null,
				null,
				regionCode,
				"{}",
				"{}",
				null,
				null);
	}
}
