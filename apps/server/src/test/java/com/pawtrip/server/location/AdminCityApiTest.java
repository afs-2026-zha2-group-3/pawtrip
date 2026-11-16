package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.pawtrip.server.pet.DogBreed;
import com.pawtrip.server.pet.DogBreedRepository;
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
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
class AdminCityApiTest {

	private static final Path DB_PATH = Path.of("target", "admin-city-api-test.db");
	private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();
	private static final List<String> MUTABLE_REGIONS = List.of("330100", "110000");

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
	AdministrativeRegionRepository regionRepository;

	@Autowired
	DogBreedRepository dogBreedRepository;

	@Autowired
	JdbcTemplate jdbcTemplate;

	@BeforeEach
	void resetRegions() {
		for (String adcode : MUTABLE_REGIONS) {
			this.jdbcTemplate.update("DELETE FROM city_allowed_dog_breed WHERE adcode = ?", adcode);
			this.jdbcTemplate.update("""
					UPDATE administrative_region SET allowed_pet_types = NULL, max_pets_per_person = NULL,
						max_single_pet_weight_kg = NULL, max_single_pet_shoulder_height_cm = NULL,
						leash_required = NULL, vaccination_proof_required = NULL, extra_fee_cents = NULL,
						reservation_required = NULL
					WHERE adcode = ?
					""", adcode);
		}
	}

	@Test
	void listsCitiesAndProvinceLeavesWithoutProvinceParents() throws Exception {
		JsonNode zhejiang = list("/api/admin/cities?provinceAdcode=330000&pageSize=100");
		assertThat(zhejiang.path("totalElements").asInt()).isGreaterThan(5);
		for (JsonNode item : zhejiang.path("items")) {
			assertThat(item.path("level").asString()).isEqualTo("city");
			assertThat(item.path("provinceAdcode").asString()).isEqualTo("330000");
			assertThat(item.path("adcode").asString()).isNotEqualTo("330000");
		}
		assertThat(adcodes(zhejiang)).contains("330100");

		JsonNode beijing = list("/api/admin/cities?provinceAdcode=110000&pageSize=100");
		assertThat(adcodes(beijing)).containsExactly("110000");
		assertThat(beijing.path("items").get(0).path("level").asString()).isEqualTo("province");

		JsonNode provinceLeaves = list("/api/admin/cities?level=province&keyword=北京");
		assertThat(adcodes(provinceLeaves)).containsExactly("110000");
	}

	@Test
	void filtersAndPaginatesCityList() throws Exception {
		JsonNode hangzhou = list("/api/admin/cities?level=city&keyword=杭州");
		assertThat(adcodes(hangzhou)).containsExactly("330100");
		assertThat(hangzhou.path("items").get(0).path("provinceName").asString()).isEqualTo("浙江省");

		JsonNode firstPage = list("/api/admin/cities?provinceAdcode=330000&page=1&pageSize=2");
		assertThat(firstPage.path("items").size()).isEqualTo(2);
		assertThat(firstPage.path("totalElements").asInt()).isGreaterThan(2);
		assertThat(firstPage.path("hasNext").asBoolean()).isTrue();
		assertThat(firstPage.path("hasPrevious").asBoolean()).isFalse();

		JsonNode secondPage = list("/api/admin/cities?provinceAdcode=330000&page=2&pageSize=2");
		assertThat(secondPage.path("hasPrevious").asBoolean()).isTrue();

		for (String url : List.of(
				"/api/admin/cities?level=district",
				"/api/admin/cities?provinceAdcode=999999",
				"/api/admin/cities?page=0",
				"/api/admin/cities?pageSize=101")) {
			this.mockMvc.perform(get(url).with(user("admin").roles("ADMIN")))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
	}

	@Test
	void updatesPoliciesAndDogBreedsWithWholeReplacementAndClearing() throws Exception {
		List<DogBreed> breeds = this.dogBreedRepository.findAllByOrderByNameAsc();
		Long firstBreed = breeds.get(0).getId();
		Long secondBreed = breeds.get(1).getId();

		this.mockMvc.perform(patch("/api/admin/cities/330100")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"allowedPetTypes":"CAT,DOG","maxPetsPerPerson":2,
							  "maxSinglePetWeightKg":9.5,"maxSinglePetShoulderHeightCm":38.25,
							  "leashRequired":true,"vaccinationProofRequired":false,
							  "extraFeeCents":1250,"reservationRequired":true},
							 "allowedDogBreedIds":[%d,%d,%d]}
							""".formatted(secondBreed, firstBreed, firstBreed)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.adcode").value("330100"))
				.andExpect(jsonPath("$.provinceName").value("浙江省"))
				.andExpect(jsonPath("$.petPolicies.allowedPetTypes").value("CAT,DOG"))
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(2))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetWeightKg").value(9.5))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetShoulderHeightCm").value(38.25))
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(true))
				.andExpect(jsonPath("$.petPolicies.vaccinationProofRequired").value(false))
				.andExpect(jsonPath("$.petPolicies.extraFeeCents").value(1250))
				.andExpect(jsonPath("$.petPolicies.reservationRequired").value(true))
				.andExpect(jsonPath("$.allowedDogBreedIds[0]").value(firstBreed.intValue()))
				.andExpect(jsonPath("$.allowedDogBreedIds[1]").value(secondBreed.intValue()))
				.andExpect(jsonPath("$.allowedDogBreedIds.length()").value(2));

		JsonNode detail = detail("/api/admin/cities/330100");
		assertThat(detail.path("petPolicies").path("allowedPetTypes").asString()).isEqualTo("CAT,DOG");
		assertThat(detail.path("allowedDogBreedIds").size()).isEqualTo(2);

		this.mockMvc.perform(patch("/api/admin/cities/330100")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"allowedDogBreedIds":[]}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.allowedPetTypes").value("CAT,DOG"))
				.andExpect(jsonPath("$.allowedDogBreedIds.length()").value(0));

		this.mockMvc.perform(patch("/api/admin/cities/330100")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"allowedPetTypes":null,"maxPetsPerPerson":null,
							  "maxSinglePetWeightKg":null,"maxSinglePetShoulderHeightCm":null,
							  "leashRequired":null,"vaccinationProofRequired":null,
							  "extraFeeCents":null,"reservationRequired":null}}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.allowedPetTypes").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.maxPetsPerPerson").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetWeightKg").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetShoulderHeightCm").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.leashRequired").value(nullValue()))
				.andExpect(jsonPath("$.petPolicies.extraFeeCents").value(nullValue()));

		this.mockMvc.perform(patch("/api/admin/cities/330100")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.petPolicies.allowedPetTypes").value(nullValue()))
				.andExpect(jsonPath("$.allowedDogBreedIds.length()").value(0));
	}

	@Test
	void rejectsInvalidUpdatesAndNonEditableRegions() throws Exception {
		this.mockMvc.perform(patch("/api/admin/cities/330100")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"allowedDogBreedIds":[999999]}
							"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

		this.mockMvc.perform(patch("/api/admin/cities/330100")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"allowedPetTypes":"BIRD"}}
							"""))
				.andExpect(status().isBadRequest());

		this.mockMvc.perform(patch("/api/admin/cities/330100")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"maxSinglePetShoulderHeightCm":8.751}}
							"""))
				.andExpect(status().isBadRequest());

		this.mockMvc.perform(patch("/api/admin/cities/330000")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"maxPetsPerPerson":1}}
							"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

		this.mockMvc.perform(get("/api/admin/cities/330000").with(user("admin").roles("ADMIN")))
				.andExpect(status().isBadRequest());

		this.mockMvc.perform(get("/api/admin/cities/999999").with(user("admin").roles("ADMIN")))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("REGION_NOT_FOUND"));

		JsonNode unchanged = detail("/api/admin/cities/330100");
		assertThat(unchanged.path("petPolicies").path("allowedPetTypes").isNull()).isTrue();
		assertThat(unchanged.path("petPolicies").path("maxSinglePetShoulderHeightCm").isNull()).isTrue();
		assertThat(unchanged.path("allowedDogBreedIds").size()).isZero();
	}

	@Test
	void allowsProvinceLeafUpdates() throws Exception {
		this.mockMvc.perform(patch("/api/admin/cities/110000")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"petPolicies":{"allowedPetTypes":"DOG","maxPetsPerPerson":1,
							  "maxSinglePetShoulderHeightCm":35.0}}
							"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.level").value("province"))
				.andExpect(jsonPath("$.petPolicies.allowedPetTypes").value("DOG"))
				.andExpect(jsonPath("$.petPolicies.maxSinglePetShoulderHeightCm").value(35.0));
	}

	@Test
	void requiresAdminRole() throws Exception {
		this.mockMvc.perform(get("/api/admin/cities"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));

		this.mockMvc.perform(get("/api/admin/cities").with(user("user").roles("USER")))
				.andExpect(status().isForbidden());
	}

	private JsonNode list(String url) throws Exception {
		String body = this.mockMvc.perform(get(url).with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();
		return JSON_MAPPER.readTree(body);
	}

	private JsonNode detail(String url) throws Exception {
		String body = this.mockMvc.perform(get(url).with(user("admin").roles("ADMIN")))
				.andExpect(status().isOk())
				.andReturn()
				.getResponse()
				.getContentAsString();
		return JSON_MAPPER.readTree(body);
	}

	private static List<String> adcodes(JsonNode page) {
		JsonNode items = page.path("items");
		List<String> adcodes = new ArrayList<>(items.size());
		for (JsonNode item : items) {
			adcodes.add(item.path("adcode").asString());
		}
		return adcodes;
	}
}
