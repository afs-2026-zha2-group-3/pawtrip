package com.pawtrip.server.pet;

import static org.assertj.core.api.Assertions.assertThat;
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
import java.util.List;
import java.util.UUID;

import com.pawtrip.server.auth.AppUser;
import com.pawtrip.server.auth.AppUserRepository;

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
class PetApiTest {

	private static final Path DB_PATH = Path.of("target", "pet-api-test.db");

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
	AppUserRepository appUserRepository;

	@Autowired
	PetRepository petRepository;

	@Autowired
	DogBreedRepository dogBreedRepository;

	private String username;

	private String otherUsername;

	@BeforeEach
	void setUp() {
		this.petRepository.deleteAll();
		this.dogBreedRepository.deleteAll();
		this.username = "pet-user-" + UUID.randomUUID();
		this.otherUsername = "pet-other-" + UUID.randomUUID();
		this.appUserRepository.save(new AppUser(this.username, "hash", true));
		this.appUserRepository.save(new AppUser(this.otherUsername, "hash", true));
	}

	@Test
	void dogBreedCatalogRequiresAuthenticationAndReturnsBreedsInNameOrder() throws Exception {
		this.mockMvc.perform(get("/api/dog-breeds"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));

		this.dogBreedRepository.saveAllAndFlush(List.of(
				new DogBreed("藏獒", true),
				new DogBreed("中华田园犬", false)));

		this.mockMvc.perform(get("/api/dog-breeds").with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(2))
			.andExpect(jsonPath("$[0].id").isNumber())
			.andExpect(jsonPath("$[0].name").value("中华田园犬"))
			.andExpect(jsonPath("$[0].officialAggressive").value(false))
			.andExpect(jsonPath("$[1].name").value("藏獒"))
			.andExpect(jsonPath("$[1].officialAggressive").value(true));
	}

	@Test
	void createsListsReadsUpdatesAndDeletesOwnPet() throws Exception {
		long petId = createPet(this.username, "Mimi");
		assertPetName(petId, "Mimi");

		this.mockMvc.perform(get("/api/pets").with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].id").value(petId))
			.andExpect(jsonPath("$[0].name").value("Mimi"))
			.andExpect(jsonPath("$[0].petType").value("CAT"));

		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi Updated","petType":"DOG","weightKg":6.25,"shoulderHeightCm":30.5,
						 "hasLeash":false,"hasVaccinationProof":true}
						"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(petId))
			.andExpect(jsonPath("$.name").value("Mimi Updated"))
			.andExpect(jsonPath("$.petType").value("DOG"))
			.andExpect(jsonPath("$.weightKg").value(6.25))
			.andExpect(jsonPath("$.shoulderHeightCm").value(30.5))
			.andExpect(jsonPath("$.hasLeash").value(false))
			.andExpect(jsonPath("$.hasVaccinationProof").value(true));

		this.mockMvc.perform(delete("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isNoContent());

		this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("PET_NOT_FOUND"));
	}

	@Test
	void rejectsInvalidPetPayloads() throws Exception {
		assertInvalidPet("{}");
		assertInvalidPet("""
				{"name":"   ","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
				 "hasLeash":true,"hasVaccinationProof":true}
				""");
		assertInvalidPet("""
				{"name":"Mimi","petType":"FISH","weightKg":4.5,"shoulderHeightCm":25.0,
				 "hasLeash":true,"hasVaccinationProof":true}
				""");
		assertInvalidPet("""
				{"name":"Mimi","petType":"CAT","weightKg":0,"shoulderHeightCm":25.0,
				 "hasLeash":true,"hasVaccinationProof":true}
				""");
		assertInvalidPet("""
				{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":-1,
				 "hasLeash":true,"hasVaccinationProof":true}
				""");
		assertInvalidPet("""
				{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
				 "hasVaccinationProof":true}
				""");
	}

	@Test
	void hidesOtherUsersPets() throws Exception {
		long petId = createPet(this.username, "Mimi");

		this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.otherUsername)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("PET_NOT_FOUND"));
		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.otherUsername))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Hijacked","petType":"DOG","weightKg":5,"shoulderHeightCm":30,
						 "hasLeash":false,"hasVaccinationProof":false}
						"""))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("PET_NOT_FOUND"));
		this.mockMvc.perform(delete("/api/pets/{petId}", petId)
					.with(user(this.otherUsername))
					.with(csrf()))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("PET_NOT_FOUND"));

		this.mockMvc.perform(get("/api/pets").with(user(this.otherUsername)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(0));
		assertPetName(petId, "Mimi");
	}

	@Test
	void requiresAuthenticationForPetEndpoints() throws Exception {
		this.mockMvc.perform(get("/api/pets"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
		this.mockMvc.perform(get("/api/pets/1"))
			.andExpect(status().isUnauthorized());
	}

	private long createPet(String owner, String name) throws Exception {
		MvcResult result = this.mockMvc.perform(post("/api/pets")
					.with(user(owner))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"%s","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true}
						""".formatted(name)))
			.andExpect(status().isCreated())
			.andExpect(header().exists("Location"))
			.andExpect(jsonPath("$.name").value(name))
			.andExpect(jsonPath("$.petType").value("CAT"))
			.andReturn();
		JsonNode body = JSON_MAPPER.readTree(result.getResponse().getContentAsString());
		long petId = body.path("id").asLong();
		assertThat(result.getResponse().getHeader("Location")).isEqualTo("/api/pets/" + petId);
		return petId;
	}

	private void assertPetName(long petId, String name) throws Exception {
		this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(petId))
			.andExpect(jsonPath("$.name").value(name));
	}

	private void assertInvalidPet(String body) throws Exception {
		this.mockMvc.perform(post("/api/pets")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content(body))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

}
