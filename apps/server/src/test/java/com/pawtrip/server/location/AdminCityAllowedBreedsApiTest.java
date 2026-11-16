package com.pawtrip.server.location;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminCityAllowedBreedsApiTest {

	private static final Path DB_PATH = Path.of("target", "admin-city-allowed-breeds-test.db");

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
	void returnsBreedCatalogWithEmptyAllowedList() throws Exception {
		this.mockMvc.perform(get("/api/admin/cities/440400/allowed-breeds")
				.with(user("admin").roles("ADMIN")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.adcode").value("440400"))
			.andExpect(jsonPath("$.name").value("珠海市"))
			.andExpect(jsonPath("$.allowedBreedIds").isEmpty())
			.andExpect(jsonPath("$.breeds.length()").value(20))
			.andExpect(jsonPath("$.breeds[?(@.name == '柯基犬')].id").value(hasItem(10)));
	}

	@Test
	void updatesAllowedBreedsAndPolicyUsesThem() throws Exception {
		this.mockMvc.perform(put("/api/admin/cities/440400/allowed-breeds")
				.with(csrf())
				.with(user("admin").roles("ADMIN"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"breedIds\":[17,10]}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.allowedBreedIds.length()").value(2))
			.andExpect(jsonPath("$.allowedBreedIds[0]").value(10))
			.andExpect(jsonPath("$.allowedBreedIds[1]").value(17));

		this.mockMvc.perform(get("/api/cities/440400/pet-policy")
				.param("breedId", "10")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.allowedBreeds", hasItem("柯基犬")))
			.andExpect(jsonPath("$.match.breedId").value(10))
			.andExpect(jsonPath("$.match.matched").value(false))
			.andExpect(jsonPath("$.match.allowed").value(true));

		this.mockMvc.perform(get("/api/cities/440400/pet-policy")
				.param("breedId", "18")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.match.matched").value(true))
			.andExpect(jsonPath("$.match.allowed").value(false));

		this.mockMvc.perform(get("/api/cities/440400/pet-policy")
				.param("breedId", "1")
				.with(user("demo")))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.match").value(nullValue()));
	}

	@Test
	void clearsAllowedBreedsWhenListIsEmpty() throws Exception {
		updateAllowedBreeds("[10]");
		this.mockMvc.perform(put("/api/admin/cities/440400/allowed-breeds")
				.with(csrf())
				.with(user("admin").roles("ADMIN"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"breedIds\":[]}"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.allowedBreedIds").isEmpty());
	}

	@Test
	void rejectsUnknownDogBreed() throws Exception {
		this.mockMvc.perform(put("/api/admin/cities/440400/allowed-breeds")
				.with(csrf())
				.with(user("admin").roles("ADMIN"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"breedIds\":[999999]}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void requiresAdminRole() throws Exception {
		this.mockMvc.perform(get("/api/admin/cities/440400/allowed-breeds"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));

		this.mockMvc.perform(put("/api/admin/cities/440400/allowed-breeds")
				.with(csrf())
				.with(user("demo"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"breedIds\":[10]}"))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
	}

	@Test
	void returnsNotFoundForUnknownOrNonCityRegion() throws Exception {
		this.mockMvc.perform(get("/api/admin/cities/999999/allowed-breeds")
				.with(user("admin").roles("ADMIN")))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("CITY_NOT_FOUND"));

		this.mockMvc.perform(get("/api/admin/cities/440000/allowed-breeds")
				.with(user("admin").roles("ADMIN")))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("CITY_NOT_FOUND"));
	}

	private void updateAllowedBreeds(String json) throws Exception {
		this.mockMvc.perform(put("/api/admin/cities/440400/allowed-breeds")
				.with(csrf())
				.with(user("admin").roles("ADMIN"))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"breedIds\":" + json + "}"))
			.andExpect(status().isOk());
	}

}
