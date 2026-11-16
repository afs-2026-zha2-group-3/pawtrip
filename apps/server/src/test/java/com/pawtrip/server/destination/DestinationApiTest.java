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
		var request = get("/api/destinations").with(user("user").roles("USER"));
		if (keyword != null) {
			request = request.param("keyword", keyword);
		}
		if (petFriendly) {
			request = request.param("petFriendly", "true");
		}
		MvcResult result = this.mockMvc.perform(request)
				.andExpect(status().isOk())
				.andReturn();
		return JSON_MAPPER.readTree(result.getResponse().getContentAsString());
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