package com.pawtrip.server.policy;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

import javax.sql.DataSource;

import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class CityPetPolicyApiTest {

	private static final Path DB_PATH = Path.of("target", "city-pet-policy-api-test.db");

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
	CityPetPolicyRepository policyRepository;

	@Autowired
	AdministrativeRegionRepository regionRepository;

	@Autowired
	DataSource dataSource;

	@BeforeEach
	void createEmptyBannedListFixture() {
		this.regionRepository.saveAndFlush(new AdministrativeRegion("990005", "Test city", null, "province", null));
		this.policyRepository.saveAndFlush(new CityPetPolicy("990005", "严格管理区", "[\"禁止饲养危险犬\"]",
				"测试来源", null, "2025-07"));
	}

	@AfterEach
	void removeEmptyBannedListFixture() throws SQLException {
		deleteAllowedBreeds("990005");
		this.policyRepository.deleteById("990005");
		this.regionRepository.deleteById("990005");
	}

	@Test
	void returnsPolicyAndMatchedFlagForBannedBreedId() throws Exception {
		this.mockMvc.perform(get("/api/cities/440400/pet-policy")
				.param("breedId", "18")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.adcode").value("440400"))
			.andExpect(jsonPath("$.name").value("珠海市"))
			.andExpect(jsonPath("$.covered").value(true))
			.andExpect(jsonPath("$.areaScope").value("严格管理区"))
			.andExpect(jsonPath("$.updatedMonth").value("2025-07"))
			.andExpect(jsonPath("$.source.title").isNotEmpty())
			.andExpect(jsonPath("$.policies").isArray())
			.andExpect(jsonPath("$.bannedBreeds.length()").value(8))
			.andExpect(jsonPath("$.bannedBreeds", hasItem("比特犬")))
			.andExpect(jsonPath("$.allowedBreeds", hasSize(7)))
			.andExpect(jsonPath("$.allowedBreeds", hasItem("柯基犬")))
			.andExpect(jsonPath("$.allowedPetTypes").value("CAT,DOG"))
			.andExpect(jsonPath("$.match.breedId").value(18))
			.andExpect(jsonPath("$.match.breedName").value("比特犬"))
			.andExpect(jsonPath("$.match.matched").value(true))
			.andExpect(jsonPath("$.match.allowed").value(false));
	}

	@Test
	void returnsNoMatchWhenBreedIsNeitherBannedNorAllowed() throws Exception {
		this.mockMvc.perform(get("/api/cities/440400/pet-policy")
				.param("breedId", "12")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.match").value(nullValue()));
	}

	@Test
	void returnsAllowedMatchForSeededAllowedBreed() throws Exception {
		this.mockMvc.perform(get("/api/cities/440400/pet-policy")
				.param("breedId", "10")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.match.breedId").value(10))
			.andExpect(jsonPath("$.match.breedName").value("柯基犬"))
			.andExpect(jsonPath("$.match.matched").value(false))
			.andExpect(jsonPath("$.match.allowed").value(true));
	}

	@Test
	void returnsNoMatchWhenBreedIdIsMissing() throws Exception {
		this.mockMvc.perform(get("/api/cities/440400/pet-policy").with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.match").value(nullValue()));
	}

	@Test
	void returnsNoMatchWhenBreedIdIsNotSelectable() throws Exception {
		this.mockMvc.perform(get("/api/cities/440400/pet-policy")
				.param("breedId", "999")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.covered").value(true))
			.andExpect(jsonPath("$.match").value(nullValue()));
	}

	@Test
	void returnsNoMatchWhenBannedListIsEmpty() throws Exception {
		this.mockMvc.perform(get("/api/cities/990005/pet-policy")
				.param("breedId", "18")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.covered").value(true))
			.andExpect(jsonPath("$.bannedBreeds").isEmpty())
			.andExpect(jsonPath("$.allowedBreeds").isEmpty())
			.andExpect(jsonPath("$.match").value(nullValue()));
	}

	@Test
	void returnsAllowedMatchForDogBreedConfiguredByAdmin() throws Exception {
		insertAllowedBreed("990005", 10L);

		this.mockMvc.perform(get("/api/cities/990005/pet-policy")
				.param("breedId", "10")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.allowedBreeds.length()").value(1))
			.andExpect(jsonPath("$.allowedBreeds", hasItem("柯基犬")))
			.andExpect(jsonPath("$.match.breedId").value(10))
			.andExpect(jsonPath("$.match.breedName").value("柯基犬"))
			.andExpect(jsonPath("$.match.matched").value(false))
			.andExpect(jsonPath("$.match.allowed").value(true));

		this.mockMvc.perform(get("/api/cities/990005/pet-policy")
				.param("breedId", "18")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.match").value(nullValue()));
	}

	@Test
	void returnsCoveredFalseForUncoveredCity() throws Exception {
		this.mockMvc.perform(get("/api/cities/440300/pet-policy").with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("深圳市"))
			.andExpect(jsonPath("$.covered").value(false));
	}

	@Test
	void returnsNotFoundForUnknownCity() throws Exception {
		this.mockMvc.perform(get("/api/cities/999999/pet-policy").with(user("demo")))
			.andExpect(status().isNotFound())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("CITY_NOT_FOUND"));
	}

	@Test
	void requiresAuthentication() throws Exception {
		this.mockMvc.perform(get("/api/cities/440400/pet-policy"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void doesNotExposeWriteOrAdminPolicyEndpoints() throws Exception {
		this.mockMvc.perform(post("/api/cities/440400/pet-policy").with(csrf()).with(user("demo")))
			.andExpect(status().isMethodNotAllowed());

		this.mockMvc.perform(get("/api/admin/pet-policies").with(user("admin").roles("ADMIN")))
			.andExpect(status().isNotFound());
	}

	private void insertAllowedBreed(String adcode, long dogBreedId) throws SQLException {
		try (Connection connection = this.dataSource.getConnection();
				PreparedStatement insert = connection.prepareStatement(
						"INSERT INTO city_allowed_dog_breed (adcode, dog_breed_id) VALUES (?, ?)")) {
			insert.setString(1, adcode);
			insert.setLong(2, dogBreedId);
			insert.executeUpdate();
		}
	}

	private void deleteAllowedBreeds(String adcode) throws SQLException {
		try (Connection connection = this.dataSource.getConnection();
				PreparedStatement delete = connection.prepareStatement(
						"DELETE FROM city_allowed_dog_breed WHERE adcode = ?")) {
			delete.setString(1, adcode);
			delete.executeUpdate();
		}
	}

}
