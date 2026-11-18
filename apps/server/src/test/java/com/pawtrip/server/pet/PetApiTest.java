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
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import com.pawtrip.server.auth.AppUser;
import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.trip.TripRepository;

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

	private static final String PHOTO_BASE64 = Base64.getEncoder().encodeToString(new byte[] {1, 2, 3, 4, 5});

	private static final String UPDATED_PHOTO_BASE64 = Base64.getEncoder().encodeToString(new byte[] {9, 8, 7});

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

	@Autowired
	TripRepository tripRepository;

	private String username;

	private String otherUsername;

	@BeforeEach
	void setUp() {
		this.tripRepository.deleteAll();
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
			.andExpect(jsonPath("$[0].petType").value("CAT"))
			.andExpect(jsonPath("$[0].photo").value(PHOTO_BASE64));

		DogBreed breed = this.dogBreedRepository.save(new DogBreed("柯基犬", false));

		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi Updated","petType":"DOG","weightKg":6.25,"shoulderHeightCm":30.5,
						 "hasLeash":false,"hasVaccinationProof":true,"photo":"%s","dogBreedId":%d}
						""".formatted(UPDATED_PHOTO_BASE64, breed.getId())))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(petId))
			.andExpect(jsonPath("$.name").value("Mimi Updated"))
			.andExpect(jsonPath("$.petType").value("DOG"))
			.andExpect(jsonPath("$.weightKg").value(6.25))
			.andExpect(jsonPath("$.shoulderHeightCm").value(30.5))
			.andExpect(jsonPath("$.hasLeash").value(false))
			.andExpect(jsonPath("$.hasVaccinationProof").value(true))
			.andExpect(jsonPath("$.photo").value(UPDATED_PHOTO_BASE64))
			.andExpect(jsonPath("$.dogBreed.id").value(breed.getId()))
			.andExpect(jsonPath("$.dogBreed.name").value("柯基犬"))
			.andExpect(jsonPath("$.dogBreed.officialAggressive").value(false));

		this.mockMvc.perform(get("/api/pets").with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].petType").value("DOG"))
			.andExpect(jsonPath("$[0].dogBreed.name").value("柯基犬"));

		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi Updated","petType":"DOG","weightKg":6.25,"shoulderHeightCm":30.5,
						 "hasLeash":false,"hasVaccinationProof":true}
						"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

		this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.dogBreed.name").value("柯基犬"));

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
		assertInvalidPet("""
				{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
				 "hasLeash":true,"hasVaccinationProof":true,"photo":"not-base64!"}
				""");
		assertInvalidPet("""
				{"name":"Rex","petType":"DOG","weightKg":10.0,"shoulderHeightCm":40.0,
				 "hasLeash":true,"hasVaccinationProof":true}
				""");
		assertInvalidPet("""
				{"name":"Rex","petType":"DOG","weightKg":10.0,"shoulderHeightCm":40.0,
				 "hasLeash":true,"hasVaccinationProof":true,"dogBreedId":999999}
				""");
		assertInvalidPet("""
				{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
				 "hasLeash":true,"hasVaccinationProof":true,"dogBreedId":1}
				""");
	}

	@Test
	void allowsPetsWithoutPhotos() throws Exception {
		DogBreed breed = this.dogBreedRepository.save(new DogBreed("柴犬", false));
		MvcResult result = this.mockMvc.perform(post("/api/pets")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"No Photo","petType":"DOG","weightKg":12.0,"shoulderHeightCm":40.0,
						 "hasLeash":true,"hasVaccinationProof":false,"dogBreedId":%d}
						""".formatted(breed.getId())))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.dogBreed.name").value("柴犬"))
			.andReturn();

		JsonNode body = JSON_MAPPER.readTree(result.getResponse().getContentAsString());
		assertThat(body.path("photo").isNull()).isTrue();
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
						{"name":"Hijacked","petType":"CAT","weightKg":5,"shoulderHeightCm":30,
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
	void refusesToDeletePetReferencedByTrip() throws Exception {
		long petId = createPet(this.username, "Mimi");
		createTripForPet(petId);

		this.mockMvc.perform(delete("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("PET_IN_USE"));

		this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Mimi"));
	}

	@Test
	void deletesPetNotReferencedByTrip() throws Exception {
		long petId = createPet(this.username, "Mimi");

		this.mockMvc.perform(delete("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isNoContent());
	}

	@Test
	void requiresAuthenticationForPetEndpoints() throws Exception {
		this.mockMvc.perform(get("/api/pets"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
		this.mockMvc.perform(get("/api/pets/1"))
			.andExpect(status().isUnauthorized());
	}

	@Test
	void createsUpdatesAndClearsPreferencesAndPersonality() throws Exception {
		MvcResult result = this.mockMvc.perform(post("/api/pets")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":["SWIMMING","GRASS_RUNNING"],"personality":"ENERGETIC"}
						"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.preferences.length()").value(2))
			.andExpect(jsonPath("$.preferences[0]").value("SWIMMING"))
			.andExpect(jsonPath("$.preferences[1]").value("GRASS_RUNNING"))
			.andExpect(jsonPath("$.personality").value("ENERGETIC"))
			.andReturn();
		long petId = JSON_MAPPER.readTree(result.getResponse().getContentAsString()).path("id").asLong();

		this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.preferences[0]").value("SWIMMING"))
			.andExpect(jsonPath("$.preferences[1]").value("GRASS_RUNNING"))
			.andExpect(jsonPath("$.personality").value("ENERGETIC"));

		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":["CITY_WALKING"],"personality":"CALM"}
						"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.preferences.length()").value(1))
			.andExpect(jsonPath("$.preferences[0]").value("CITY_WALKING"))
			.andExpect(jsonPath("$.personality").value("CALM"));

		this.mockMvc.perform(get("/api/pets").with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].preferences[0]").value("CITY_WALKING"))
			.andExpect(jsonPath("$[0].personality").value("CALM"));

		MvcResult cleared = this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":[],"personality":null}
						"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.preferences.length()").value(0))
			.andReturn();
		JsonNode clearedBody = JSON_MAPPER.readTree(cleared.getResponse().getContentAsString());
		assertThat(clearedBody.path("personality").isNull()).isTrue();
	}

	@Test
	void rejectsUnknownPreferenceOrPersonalityKeysWithoutPersisting() throws Exception {
		assertInvalidPet("""
				{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
				 "hasLeash":true,"hasVaccinationProof":true,"preferences":["FLYING"]}
				""");
		assertInvalidPet("""
				{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
				 "hasLeash":true,"hasVaccinationProof":true,"personality":"WILD"}
				""");
		assertThat(this.petRepository.count()).isZero();

		long petId = createPet(this.username, "Mimi");
		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":["SWIMMING"],"personality":"CALM"}
						"""))
			.andExpect(status().isOk());

		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":["SWIMMING","UNKNOWN"],"personality":"CALM"}
						"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":["SWIMMING"],"personality":"WILD"}
						"""))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

		this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.preferences.length()").value(1))
			.andExpect(jsonPath("$.preferences[0]").value("SWIMMING"))
			.andExpect(jsonPath("$.personality").value("CALM"));
	}

	@Test
	void deduplicatesPreferenceKeys() throws Exception {
		this.mockMvc.perform(post("/api/pets")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":["SWIMMING","SWIMMING","GRASS_RUNNING","SWIMMING"]}
						"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.preferences.length()").value(2))
			.andExpect(jsonPath("$.preferences[0]").value("SWIMMING"))
			.andExpect(jsonPath("$.preferences[1]").value("GRASS_RUNNING"));
	}

	@Test
	void treatsOmittedOrEmptyPreferencesAndPersonalityAsUnset() throws Exception {
		long petId = createPet(this.username, "Mimi");
		MvcResult omitted = this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.preferences.length()").value(0))
			.andReturn();
		assertThat(JSON_MAPPER.readTree(omitted.getResponse().getContentAsString())
				.path("personality").isNull()).isTrue();

		MvcResult empty = this.mockMvc.perform(put("/api/pets/{petId}", petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"Mimi","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,
						 "preferences":[],"personality":null}
						"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.preferences.length()").value(0))
			.andReturn();
		assertThat(JSON_MAPPER.readTree(empty.getResponse().getContentAsString())
				.path("personality").isNull()).isTrue();
	}

	@Test
	void readsLegacyPetRowsWithNullPreferencesAndPersonality() throws Exception {
		long userId = this.appUserRepository.findByUsername(this.username).orElseThrow().getId();
		long petId;
		try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + DB_PATH + "?foreign_keys=on");
				PreparedStatement insert = connection.prepareStatement(
						"INSERT INTO pet (user_id, name, pet_type, weight_kg, shoulder_height_cm, has_leash, "
								+ "has_vaccination_proof) VALUES (?, 'Legacy', 'CAT', 3.0, 20.0, 1, 0)",
						Statement.RETURN_GENERATED_KEYS)) {
			insert.setLong(1, userId);
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				petId = keys.getLong(1);
			}
		}

		this.mockMvc.perform(get("/api/pets").with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.length()").value(1))
			.andExpect(jsonPath("$[0].name").value("Legacy"))
			.andExpect(jsonPath("$[0].preferences.length()").value(0));

		MvcResult detail = this.mockMvc.perform(get("/api/pets/{petId}", petId).with(user(this.username)))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("Legacy"))
			.andExpect(jsonPath("$.weightKg").value(3.0))
			.andExpect(jsonPath("$.preferences.length()").value(0))
			.andReturn();
		assertThat(JSON_MAPPER.readTree(detail.getResponse().getContentAsString())
				.path("personality").isNull()).isTrue();
	}

	private void createTripForPet(long petId) throws Exception {
		this.mockMvc.perform(post("/api/trips")
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"带宠物行程","cityAdcode":"330100","petId":%d,"totalDays":1}
							""".formatted(petId)))
			.andExpect(status().isCreated());
	}

	private long createPet(String owner, String name) throws Exception {
		MvcResult result = this.mockMvc.perform(post("/api/pets")
					.with(user(owner))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
						{"name":"%s","petType":"CAT","weightKg":4.5,"shoulderHeightCm":25.0,
						 "hasLeash":true,"hasVaccinationProof":true,"photo":"%s"}
						""".formatted(name, PHOTO_BASE64)))
			.andExpect(status().isCreated())
			.andExpect(header().exists("Location"))
			.andExpect(jsonPath("$.name").value(name))
			.andExpect(jsonPath("$.petType").value("CAT"))
			.andExpect(jsonPath("$.photo").value(PHOTO_BASE64))
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
			.andExpect(jsonPath("$.name").value(name))
			.andExpect(jsonPath("$.photo").value(PHOTO_BASE64));
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
