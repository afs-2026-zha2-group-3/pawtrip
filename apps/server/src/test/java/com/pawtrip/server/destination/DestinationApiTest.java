package com.pawtrip.server.destination;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
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
class DestinationApiTest {

	private static final Path DB_PATH = Path.of("target", "destination-api-test.db");
	// 与 V16 种子一致；用例清理时用于恢复被改动的城市
	private static final String SEED_BREED_NAMES =
			"'柯基犬', '贵宾犬', '金毛寻回犬', '拉布拉多寻回犬', '比熊犬', '博美犬', '哈士奇'";
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

	@Test
	void unauthenticatedRequestReturnsUnauthenticatedProblem() throws Exception {
		this.mockMvc.perform(get("/api/destinations"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void candidatesAreAllCityLevelRegionsWithProvince() throws Exception {
		JsonNode candidates = fetchCandidates(null);

		assertThat(candidates.size()).isGreaterThan(2);
		JsonNode hangzhou = findCandidate(candidates, "330100");
		assertThat(hangzhou.path("name").asString()).isEqualTo("杭州市");
		assertThat(hangzhou.path("province").asString()).isEqualTo("浙江省");

		JsonNode zhuhai = findCandidate(candidates, "440400");
		assertThat(zhuhai.path("name").asString()).isEqualTo("珠海市");
		assertThat(zhuhai.path("province").asString()).isEqualTo("广东省");

		for (JsonNode candidate : candidates) {
			assertThat(candidate.path("adcode").asString()).isNotBlank();
			assertThat(candidate.path("name").asString()).isNotBlank();
		}
		assertThat(findCandidateOrNull(candidates, "330000")).isNull();
	}

	@Test
	void policyFieldsArePlaceholdersUntilDataSourceIsDecided() throws Exception {
		JsonNode candidates = fetchCandidates(null);

		for (JsonNode candidate : candidates) {
			assertThat(candidate.path("policyCovered").asBoolean()).isFalse();
			assertThat(candidate.path("bannedBreeds").size()).isZero();
		}
	}

	@Test
	void keywordFiltersCandidatesByCityNameOrProvince() throws Exception {
		this.mockMvc.perform(get("/api/destinations").param("keyword", "杭州")
					.with(user("user").roles("USER")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].adcode").value("330100"));

		JsonNode guangdong = fetchCandidates("广东");
		assertThat(guangdong.size()).isGreaterThan(1);
		for (JsonNode candidate : guangdong) {
			assertThat(candidate.path("province").asString()).isEqualTo("广东省");
		}
		assertThat(findCandidate(guangdong, "440400").path("name").asString()).isEqualTo("珠海市");

		this.mockMvc.perform(get("/api/destinations").param("keyword", " 杭州 ")
					.with(user("user").roles("USER")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].adcode").value("330100"));

		this.mockMvc.perform(get("/api/destinations").param("keyword", "不存在的城市")
					.with(user("user").roles("USER")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void petFriendlyFilterExcludesOnlyRegionsBanningAllPets() throws Exception {
		int total = fetchCandidates(null).size();
		try {
			executeUpdate("UPDATE administrative_region SET max_pets_per_person = 0 WHERE adcode = '330100'");
			executeUpdate("UPDATE administrative_region SET max_pets_per_person = 1 WHERE adcode = '130100'");
			executeUpdate("UPDATE administrative_region SET max_pets_per_person = 2 WHERE adcode = '440400'");

			JsonNode friendly = fetchCandidates(null, true);
			assertThat(friendly.size()).isEqualTo(total - 1);
			assertThat(findCandidateOrNull(friendly, "330100")).isNull();
			assertThat(findCandidate(friendly, "130100").path("name").asString()).isEqualTo("石家庄市");
			assertThat(findCandidate(friendly, "440400").path("name").asString()).isEqualTo("珠海市");

			this.mockMvc.perform(get("/api/destinations").param("petFriendly", "true").param("keyword", "杭州")
						.with(user("user").roles("USER")))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.length()").value(0));

			this.mockMvc.perform(get("/api/destinations").param("petFriendly", "true").param("keyword", "珠海")
						.with(user("user").roles("USER")))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.length()").value(1))
					.andExpect(jsonPath("$[0].adcode").value("440400"));

			assertThat(findCandidateOrNull(fetchCandidates(null), "330100")).isNotNull();
		}
		finally {
			executeUpdate("UPDATE administrative_region SET max_pets_per_person = NULL "
					+ "WHERE adcode IN ('330100', '130100', '440400')");
		}
	}

	@Test
	void allCitiesAreSeededWithAllowedTypesAndNonAggressiveBreeds() throws Exception {
		JsonNode candidates = fetchCandidates(null);
		assertThat(candidates.size()).isGreaterThan(2);
		for (JsonNode candidate : candidates) {
			assertThat(candidate.path("allowedPetTypes").asString()).isEqualTo("CAT,DOG");
			assertThat(candidate.path("allowedDogBreedIds").size()).isEqualTo(7);
		}
	}

	@Test
	void candidatesExposeAllowedPetTypesAndBreedIds() throws Exception {
		long breedId = queryLong("SELECT id FROM dog_breed ORDER BY id LIMIT 1");
		long zhuhaiBaseline = queryLong("SELECT COUNT(*) FROM city_allowed_dog_breed WHERE adcode = '440400'");
		try {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT' WHERE adcode = '330100'");
			executeUpdate("DELETE FROM city_allowed_dog_breed WHERE adcode = '330100'");
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = NULL WHERE adcode = '130100'");
			executeUpdate("INSERT INTO city_allowed_dog_breed (adcode, dog_breed_id) VALUES ('440400', " + breedId + ")");

			JsonNode candidates = fetchCandidates(null);
			JsonNode hangzhou = findCandidate(candidates, "330100");
			assertThat(hangzhou.path("allowedPetTypes").asString()).isEqualTo("CAT");
			assertThat(hangzhou.path("allowedDogBreedIds").size()).isZero();

			JsonNode zhuhai = findCandidate(candidates, "440400");
			assertThat(zhuhai.path("allowedDogBreedIds").size()).isEqualTo((int) zhuhaiBaseline + 1);
			assertThat(zhuhai.path("allowedDogBreedIds").toString()).contains(String.valueOf(breedId));

			JsonNode shijiazhuang = findCandidate(candidates, "130100");
			assertThat(shijiazhuang.path("allowedPetTypes").isNull()).isTrue();
		}
		finally {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG' "
					+ "WHERE adcode IN ('330100', '130100')");
			restoreSeedBreeds("330100");
			executeUpdate("DELETE FROM city_allowed_dog_breed WHERE adcode = '440400' AND dog_breed_id = " + breedId);
		}
	}

	@Test
	void petFriendlyFilterMatchesPetTypeWhenProvided() throws Exception {
		int total = fetchCandidates(null).size();
		try {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT' WHERE adcode = '330100'");
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'DOG' WHERE adcode = '130100'");
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG' WHERE adcode = '440400'");

			// 类型 null=不允许：仅 CAT 的杭州被排除，其余城市种子均含 DOG
			JsonNode dogFriendly = fetchCandidates(null, true, "DOG", null);
			assertThat(dogFriendly.size()).isEqualTo(total - 1);
			assertThat(findCandidateOrNull(dogFriendly, "330100")).isNull();
			assertThat(findCandidateOrNull(dogFriendly, "130100")).isNotNull();
			assertThat(findCandidateOrNull(dogFriendly, "440400")).isNotNull();

			JsonNode catFriendly = fetchCandidates(null, true, "CAT", null);
			assertThat(catFriendly.size()).isEqualTo(total - 1);
			assertThat(findCandidateOrNull(catFriendly, "130100")).isNull();
			assertThat(findCandidateOrNull(catFriendly, "330100")).isNotNull();

			// 未传 petType：退化为仅限养数规则，类型配置不参与过滤
			assertThat(fetchCandidates(null, true).size()).isEqualTo(total);
		}
		finally {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG' "
					+ "WHERE adcode IN ('330100', '130100', '440400')");
		}
	}

	@Test
	void petFriendlyFilterMatchesBreedWhenProvided() throws Exception {
		long breedA = queryLong("SELECT id FROM dog_breed ORDER BY id LIMIT 1");
		long breedB = queryLong("SELECT id FROM dog_breed ORDER BY id DESC LIMIT 1");
		assertThat(breedA).isNotEqualTo(breedB);
		try {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'DOG' WHERE adcode = '330100'");
			executeUpdate("DELETE FROM city_allowed_dog_breed WHERE adcode = '330100'");
			executeUpdate("INSERT INTO city_allowed_dog_breed (adcode, dog_breed_id) VALUES ('440400', " + breedA + ")");

			// 珠海允许品种=种子+breedA：breedB 排除；杭州品种列表为空=未配置放行
			JsonNode withBreedB = fetchCandidates(null, true, "DOG", breedB);
			assertThat(findCandidateOrNull(withBreedB, "440400")).isNull();
			assertThat(findCandidateOrNull(withBreedB, "330100")).isNotNull();

			JsonNode withBreedA = fetchCandidates(null, true, "DOG", breedA);
			assertThat(findCandidateOrNull(withBreedA, "440400")).isNotNull();

			// CAT 不校验品种层
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG' WHERE adcode = '330100'");
			JsonNode catWithBreedB = fetchCandidates(null, true, "CAT", breedB);
			assertThat(findCandidateOrNull(catWithBreedB, "440400")).isNotNull();

			// 未开启筛选时品种参数不参与过滤
			assertThat(findCandidateOrNull(fetchCandidates(null, false, "DOG", breedB), "440400")).isNotNull();
		}
		finally {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG' WHERE adcode = '330100'");
			restoreSeedBreeds("330100");
			executeUpdate("DELETE FROM city_allowed_dog_breed WHERE adcode = '440400' AND dog_breed_id = " + breedA);
		}
	}

	@Test
	void petFriendlyFilterMatchesShoulderHeightWhenProvided() throws Exception {
		try {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG', "
					+ "max_single_pet_shoulder_height_cm = 40 WHERE adcode = '330100'");
			executeUpdate("UPDATE administrative_region SET max_single_pet_shoulder_height_cm = 60 "
					+ "WHERE adcode = '440400'");

			int total = fetchCandidates(null).size();
			JsonNode tall = fetchCandidates(null, true, "DOG", null, 45.0);
			assertThat(findCandidateOrNull(tall, "330100")).isNull();
			assertThat(findCandidateOrNull(tall, "440400")).isNotNull();
			// 其余城市肩高上限 null=不限制，种子类型均允许
			assertThat(tall.size()).isEqualTo(total - 1);

			JsonNode small = fetchCandidates(null, true, "DOG", null, 35.0);
			assertThat(findCandidateOrNull(small, "330100")).isNotNull();
			assertThat(small.size()).isEqualTo(total);

			// 响应字段与配置一致
			JsonNode candidates = fetchCandidates(null);
			assertThat(findCandidate(candidates, "330100").path("maxSinglePetShoulderHeightCm").asDouble())
					.isEqualTo(40.0);
			assertThat(findCandidate(candidates, "130100").path("maxSinglePetShoulderHeightCm").isNull()).isTrue();
		}
		finally {
			executeUpdate("UPDATE administrative_region SET allowed_pet_types = 'CAT,DOG', "
					+ "max_single_pet_shoulder_height_cm = NULL WHERE adcode = '330100'");
			executeUpdate("UPDATE administrative_region SET max_single_pet_shoulder_height_cm = NULL "
					+ "WHERE adcode = '440400'");
		}
	}

	@Test
	void invalidPetTypeReturnsBadRequest() throws Exception {
		this.mockMvc.perform(get("/api/destinations").param("petType", "BIRD")
					.with(user("user").roles("USER")))
				.andExpect(status().isBadRequest());
	}

	@Test
	void noSelectionWriteEndpointAndNoAdminBannedBreedMaintenanceEndpoint() throws Exception {
		this.mockMvc.perform(post("/api/destinations")
					.with(user("user").roles("USER"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"adcode":"330100"}
						"""))
				.andExpect(status().isMethodNotAllowed());
		this.mockMvc.perform(put("/api/destinations/selection")
					.with(user("user").roles("USER"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"adcode":"330100"}
						"""))
				.andExpect(status().isNotFound());

		this.mockMvc.perform(post("/api/admin/regions/440400/banned-breeds")
					.with(user("admin").roles("ADMIN"))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"breedName":"比特犬"}
						"""))
				.andExpect(status().isNotFound());
	}

	private JsonNode fetchCandidates(String keyword) throws Exception {
		return fetchCandidates(keyword, false);
	}

	private JsonNode fetchCandidates(String keyword, boolean petFriendly) throws Exception {
		return fetchCandidates(keyword, petFriendly, null, null);
	}

	private JsonNode fetchCandidates(String keyword, boolean petFriendly, String petType, Long breedId)
			throws Exception {
		return fetchCandidates(keyword, petFriendly, petType, breedId, null);
	}

	private JsonNode fetchCandidates(String keyword, boolean petFriendly, String petType, Long breedId,
			Double shoulderHeightCm) throws Exception {
		var request = get("/api/destinations").with(user("user").roles("USER"));
		if (keyword != null) {
			request = request.param("keyword", keyword);
		}
		if (petFriendly) {
			request = request.param("petFriendly", "true");
		}
		if (petType != null) {
			request = request.param("petType", petType);
		}
		if (breedId != null) {
			request = request.param("breedId", String.valueOf(breedId));
		}
		if (shoulderHeightCm != null) {
			request = request.param("shoulderHeightCm", String.valueOf(shoulderHeightCm));
		}
		MvcResult result = this.mockMvc.perform(request)
				.andExpect(status().isOk())
				.andReturn();
		return JSON_MAPPER.readTree(result.getResponse().getContentAsString());
	}

	private static void restoreSeedBreeds(String adcode) throws Exception {
		executeUpdate("INSERT OR IGNORE INTO city_allowed_dog_breed (adcode, dog_breed_id) "
				+ "SELECT '" + adcode + "', id FROM dog_breed WHERE name IN (" + SEED_BREED_NAMES + ")");
	}

	private static long queryLong(String sql) throws Exception {
		try (java.sql.Connection connection = java.sql.DriverManager
				.getConnection("jdbc:sqlite:" + DB_PATH + "?foreign_keys=on");
				java.sql.Statement statement = connection.createStatement();
				java.sql.ResultSet resultSet = statement.executeQuery(sql)) {
			if (!resultSet.next()) {
				throw new AssertionError("Query returned no row: " + sql);
			}
			return resultSet.getLong(1);
		}
	}

	private static void executeUpdate(String sql) throws Exception {
		try (java.sql.Connection connection = java.sql.DriverManager
				.getConnection("jdbc:sqlite:" + DB_PATH + "?foreign_keys=on");
				java.sql.Statement statement = connection.createStatement()) {
			statement.executeUpdate(sql);
		}
	}

	private static JsonNode findCandidate(JsonNode candidates, String adcode) {
		JsonNode candidate = findCandidateOrNull(candidates, adcode);
		if (candidate == null) {
			throw new AssertionError("Candidate not found: " + adcode);
		}
		return candidate;
	}

	private static JsonNode findCandidateOrNull(JsonNode candidates, String adcode) {
		for (JsonNode candidate : candidates) {
			if (adcode.equals(candidate.path("adcode").asString())) {
				return candidate;
			}
		}
		return null;
	}

}