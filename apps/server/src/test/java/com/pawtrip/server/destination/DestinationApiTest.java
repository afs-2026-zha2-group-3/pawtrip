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
	void candidatesContainBothPilotCitiesWithCoverageAndBannedBreeds() throws Exception {
		MvcResult result = this.mockMvc.perform(get("/api/destinations").with(user("user").roles("USER")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2))
				.andReturn();
		JsonNode candidates = JSON_MAPPER.readTree(result.getResponse().getContentAsString());

		JsonNode hangzhou = findCandidate(candidates, "330100");
		assertThat(hangzhou.path("name").asString()).isEqualTo("杭州市");
		assertThat(hangzhou.path("province").asString()).isEqualTo("浙江省");
		assertThat(hangzhou.path("policyCovered").asBoolean()).isTrue();
		assertThat(hangzhou.path("bannedBreeds").size()).isEqualTo(33);
		assertThat(breedNames(hangzhou)).contains("比特犬", "日本土佐", "藏獒", "中华田园犬");

		JsonNode zhuhai = findCandidate(candidates, "440400");
		assertThat(zhuhai.path("name").asString()).isEqualTo("珠海市");
		assertThat(zhuhai.path("province").asString()).isEqualTo("广东省");
		assertThat(zhuhai.path("policyCovered").asBoolean()).isTrue();
		assertThat(zhuhai.path("bannedBreeds").size()).isEqualTo(38);
		assertThat(breedNames(zhuhai)).contains("比特犬", "日本土佐", "罗威纳犬", "凯丽蓝梗");
	}

	@Test
	void everyBannedBreedEntryCarriesGovernmentSourceAndUpdateDate() throws Exception {
		MvcResult result = this.mockMvc.perform(get("/api/destinations").with(user("user").roles("USER")))
				.andExpect(status().isOk())
				.andReturn();
		JsonNode candidates = JSON_MAPPER.readTree(result.getResponse().getContentAsString());

		for (JsonNode candidate : candidates) {
			for (JsonNode breed : candidate.path("bannedBreeds")) {
				assertThat(breed.path("breedName").asString()).isNotBlank();
				assertThat(breed.path("source").asString()).isNotBlank();
				assertThat(breed.path("updated").asString()).matches("\\d{4}-\\d{2}-\\d{2}");
			}
		}

		JsonNode hangzhou = findCandidate(candidates, "330100");
		assertThat(findBreed(hangzhou, "比特犬").path("source").asString()).contains("杭州市限制养犬规定");
		assertThat(findBreed(hangzhou, "比特犬").path("updated").asString()).isEqualTo("2007-08-13");

		JsonNode zhuhai = findCandidate(candidates, "440400");
		assertThat(findBreed(zhuhai, "比特犬").path("source").asString()).contains("危险犬标准及品种的通告");
		assertThat(findBreed(zhuhai, "比特犬").path("updated").asString()).isEqualTo("2021-03-01");
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

	private static JsonNode findCandidate(JsonNode candidates, String adcode) {
		for (JsonNode candidate : candidates) {
			if (adcode.equals(candidate.path("adcode").asString())) {
				return candidate;
			}
		}
		throw new AssertionError("Candidate not found: " + adcode);
	}

	private static JsonNode findBreed(JsonNode candidate, String breedName) {
		for (JsonNode breed : candidate.path("bannedBreeds")) {
			if (breedName.equals(breed.path("breedName").asString())) {
				return breed;
			}
		}
		throw new AssertionError("Breed not found: " + breedName);
	}

	private static java.util.List<String> breedNames(JsonNode candidate) {
		java.util.List<String> names = new java.util.ArrayList<>();
		for (JsonNode breed : candidate.path("bannedBreeds")) {
			names.add(breed.path("breedName").asString());
		}
		return names;
	}

}