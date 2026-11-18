package com.pawtrip.server.packing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.pawtrip.server.auth.AppUser;
import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.pet.Pet;
import com.pawtrip.server.pet.PetRepository;
import com.pawtrip.server.pet.PetType;
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
import org.springframework.test.web.servlet.ResultMatcher;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
class PackingChecklistApiTest {

	private static final Path DB_PATH = Path.of("target", "packing-api-test.db");

	private static final JsonMapper JSON_MAPPER = JsonMapper.builder().build();

	private static final String CITY_ADCODE = "330100";

	private static final String EMPTY_PLAN = "{\"version\":1,\"days\":[],\"unscheduled\":[]}";

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
	TripRepository tripRepository;

	@Autowired
	TripPackingChecklistRepository checklistRepository;

	@Autowired
	TripPackingItemRepository itemRepository;

	private String username;

	private String otherUsername;

	private long petId;

	private long otherPetId;

	private long otherTripId;

	@BeforeEach
	void setUp() throws Exception {
		this.itemRepository.deleteAll();
		this.checklistRepository.deleteAll();
		this.tripRepository.deleteAll();
		this.petRepository.deleteAll();
		this.username = "packing-user-" + UUID.randomUUID();
		this.otherUsername = "packing-other-" + UUID.randomUUID();
		AppUser user = this.appUserRepository.save(new AppUser(this.username, "hash", true));
		AppUser other = this.appUserRepository.save(new AppUser(this.otherUsername, "hash", true));
		this.petId = this.petRepository
			.save(new Pet(user.getId(), "Mimi", PetType.CAT, 4.5, 25.0, true, false, null, null, null, null))
			.getId();
		this.otherPetId = this.petRepository
			.save(new Pet(other.getId(), "Rex", PetType.DOG, 18.0, 60.0, true, true, null, null, null, null))
			.getId();
		this.otherTripId = createTrip(this.otherUsername, "他人行程", this.otherPetId, 3, "flight");
	}

	@Test
	void generatesChecklistAndReturnsSameChecklistOnRepeat() throws Exception {
		long tripId = createTrip(this.username, "高铁行程", this.petId, 3, "high_speed_rail");

		JsonNode created = generate(tripId, this.username, status().isCreated());
		assertThat(created.path("tripId").asLong()).isEqualTo(tripId);
		assertThat(created.path("transportMode").asText()).isEqualTo("high_speed_rail");
		assertThat(created.path("totalDays").asInt()).isEqualTo(3);
		assertThat(created.path("progress").path("total").asInt()).isEqualTo(8);
		assertThat(created.path("progress").path("checked").asInt()).isZero();
		assertThat(item(created, "food").path("quantity").asInt()).isEqualTo(6);
		assertThat(item(created, "cat-carrier").path("name").asText()).isEqualTo("猫用运输包（S 码）");
		assertThat(item(created, "cat-carrier").path("source").asText()).isEqualTo("TEMPLATE");
		assertThat(item(created, "air-crate")).isNull();
		assertThat(item(created, "vaccination-proof")).isNull();

		JsonNode repeated = generate(tripId, this.username, status().isOk());
		assertThat(ids(repeated)).containsExactlyElementsOf(ids(created));
	}

	@Test
	void requiresAuthenticationAndHidesOtherUsersTrips() throws Exception {
		this.mockMvc.perform(get("/api/trips/{tripId}/packing-checklist", this.otherTripId))
			.andExpect(status().isUnauthorized());

		long tripId = createTrip(this.username, "本人行程", this.petId, 3, "high_speed_rail");
		this.mockMvc.perform(post("/api/trips/{tripId}/packing-checklist", this.otherTripId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("TRIP_NOT_FOUND"));
		this.mockMvc.perform(get("/api/trips/{tripId}/packing-checklist", this.otherTripId)
					.with(user(this.username)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("TRIP_NOT_FOUND"));
		this.mockMvc.perform(get("/api/trips/{tripId}/packing-checklist", tripId).with(user(this.username)))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("PACKING_CHECKLIST_NOT_FOUND"));
	}

	@Test
	void rejectsGenerationWhenPetProfileIsMissing() throws Exception {
		long tripId = createTrip(this.username, "无档案行程", this.petId, 3, "high_speed_rail");
		deletePetDirectly(this.petId);

		this.mockMvc.perform(post("/api/trips/{tripId}/packing-checklist", tripId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.code").value("PET_PROFILE_REQUIRED"));
		assertThat(this.checklistRepository.findByTripId(tripId)).isEmpty();
	}

	@Test
	void addsUpdatesAndDeletesCustomItems() throws Exception {
		long tripId = createTrip(this.username, "自定义物品", this.petId, 3, "high_speed_rail");
		generate(tripId, this.username, status().isCreated());

		MvcResult addedResult = this.mockMvc.perform(post("/api/trips/{tripId}/packing-checklist/items", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"宠物雨衣","category":"TRAVEL","quantity":1}
							"""))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.source").value("CUSTOM"))
			.andExpect(jsonPath("$.templateKey").value(nullValue()))
			.andReturn();
		long itemId = JSON_MAPPER.readTree(addedResult.getResponse().getContentAsString()).path("id").asLong();

		this.mockMvc.perform(put("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, itemId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"宠物雨衣","category":"TRAVEL","quantity":3,"checked":true}
							"""))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.quantity").value(3))
			.andExpect(jsonPath("$.checked").value(true));

		JsonNode checklist = read(tripId);
		assertThat(item(checklist, null, itemId).path("quantity").asInt()).isEqualTo(3);
		assertThat(item(checklist, null, itemId).path("checked").asBoolean()).isTrue();
		assertThat(checklist.path("progress").path("checked").asInt()).isEqualTo(1);
		assertThat(checklist.path("progress").path("total").asInt()).isEqualTo(9);

		this.mockMvc.perform(delete("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, itemId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isNoContent());
		JsonNode afterDelete = read(tripId);
		assertThat(item(afterDelete, null, itemId)).isNull();
		assertThat(afterDelete.path("progress").path("total").asInt()).isEqualTo(8);
	}

	@Test
	void rejectsInvalidItemRequests() throws Exception {
		long tripId = createTrip(this.username, "非法物品", this.petId, 3, "high_speed_rail");
		generate(tripId, this.username, status().isCreated());

		for (String body : List.of(
				"{\"name\":\"  \",\"category\":\"TRAVEL\",\"quantity\":1}",
				"{\"name\":\"雨衣\",\"category\":\"OTHER\",\"quantity\":1}",
				"{\"name\":\"雨衣\",\"category\":\"TRAVEL\",\"quantity\":0}",
				"{\"name\":\"雨衣\",\"category\":\"TRAVEL\",\"quantity\":100}")) {
			this.mockMvc.perform(post("/api/trips/{tripId}/packing-checklist/items", tripId)
						.with(user(this.username))
						.with(csrf())
						.contentType(MediaType.APPLICATION_JSON)
						.content(body))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}

		JsonNode checklist = read(tripId);
		assertThat(checklist.path("progress").path("total").asInt()).isEqualTo(8);
		long itemId = item(checklist, "food").path("id").asLong();
		this.mockMvc.perform(put("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, itemId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"quantity\":0}"))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		this.mockMvc.perform(put("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, 999999)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"quantity\":2}"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.code").value("PACKING_ITEM_NOT_FOUND"));
	}

	@Test
	void tracksProgressByItemRows() throws Exception {
		long tripId = createTrip(this.username, "进度行程", this.petId, 3, "high_speed_rail");
		JsonNode checklist = generate(tripId, this.username, status().isCreated());
		long foodId = item(checklist, "food").path("id").asLong();

		this.mockMvc.perform(put("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, foodId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"checked\":true}"))
			.andExpect(status().isOk());

		JsonNode updated = read(tripId);
		assertThat(updated.path("progress").path("checked").asInt()).isEqualTo(1);
		assertThat(updated.path("progress").path("total").asInt()).isEqualTo(8);

		this.mockMvc.perform(put("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, foodId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"checked\":false}"))
			.andExpect(status().isOk());
		assertThat(read(tripId).path("progress").path("checked").asInt()).isZero();
	}

	@Test
	void syncsTemplateItemsWithPetAndTripChanges() throws Exception {
		long tripId = createTrip(this.username, "同步行程", this.petId, 3, "high_speed_rail");
		JsonNode checklist = generate(tripId, this.username, status().isCreated());
		long foodId = item(checklist, "food").path("id").asLong();
		long carrierId = item(checklist, "cat-carrier").path("id").asLong();
		checkItem(tripId, carrierId, true);

		updatePet("Mimi", PetType.CAT, 6.0, 25.0, true, false);
		assertThat(item(read(tripId), "cat-carrier").path("name").asText()).isEqualTo("猫用运输包（M 码）");
		assertThat(item(read(tripId), "cat-carrier").path("checked").asBoolean()).isTrue();

		updateTrip(tripId, "同步行程", 5, "high_speed_rail");
		assertThat(item(read(tripId), "food").path("quantity").asInt()).isEqualTo(10);
		assertThat(item(read(tripId), "food").path("id").asLong()).isEqualTo(foodId);

		updateTrip(tripId, "同步行程", 5, "flight");
		JsonNode flight = read(tripId);
		assertThat(item(flight, "air-crate").path("name").asText()).isEqualTo("航空箱（M 码）");
		assertThat(item(flight, "air-crate").path("checked").asBoolean()).isFalse();
		assertThat(item(flight, "vaccination-proof")).isNotNull();
		assertThat(item(flight, "cat-carrier")).isNull();
		assertThat(flight.path("progress").path("checked").asInt()).isZero();

		updateTrip(tripId, "同步行程", 5, "high_speed_rail");
		JsonNode rail = read(tripId);
		assertThat(item(rail, "cat-carrier")).isNotNull();
		assertThat(item(rail, "cat-carrier").path("checked").asBoolean()).isFalse();
		assertThat(item(rail, "air-crate")).isNull();
		assertThat(item(rail, "vaccination-proof")).isNull();
	}

	@Test
	void preservesCustomItemsQuantityOverridesAndDeletedTemplateItems() throws Exception {
		long tripId = createTrip(this.username, "保留行程", this.petId, 3, "high_speed_rail");
		JsonNode checklist = generate(tripId, this.username, status().isCreated());
		long foodId = item(checklist, "food").path("id").asLong();
		long leashId = item(checklist, "leash").path("id").asLong();

		this.mockMvc.perform(put("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, foodId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"quantity\":20}"))
			.andExpect(status().isOk());
		this.mockMvc.perform(post("/api/trips/{tripId}/packing-checklist/items", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"宠物雨衣","category":"TRAVEL","quantity":1}
							"""))
			.andExpect(status().isCreated());
		this.mockMvc.perform(delete("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, leashId)
					.with(user(this.username))
					.with(csrf()))
			.andExpect(status().isNoContent());

		updatePet("Mimi", PetType.CAT, 6.0, 25.0, true, false);
		updateTrip(tripId, "保留行程", 5, "flight");
		updateTrip(tripId, "保留行程", 5, "high_speed_rail");
		JsonNode synced = read(tripId);

		assertThat(item(synced, "food").path("quantity").asInt()).isEqualTo(20);
		assertThat(item(synced, "leash")).isNull();
		assertThat(names(synced)).contains("宠物雨衣");
	}

	@Test
	void deletesChecklistWithTrip() throws Exception {
		long tripId = createTrip(this.username, "删除行程", this.petId, 3, "high_speed_rail");
		generate(tripId, this.username, status().isCreated());
		assertThat(this.checklistRepository.findByTripId(tripId)).isPresent();

		this.mockMvc.perform(delete("/api/trips/{tripId}", tripId).with(user(this.username)).with(csrf()))
			.andExpect(status().isNoContent());

		assertThat(this.checklistRepository.findByTripId(tripId)).isEmpty();
		assertThat(this.itemRepository.findAll()).isEmpty();
	}

	private long createTrip(String owner, String name, long petId, int totalDays, String transportMode)
			throws Exception {
		MvcResult result = this.mockMvc.perform(post("/api/trips")
					.with(user(owner))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"%s","cityAdcode":"%s","petId":%d,"totalDays":%d,"transportMode":"%s"}
							""".formatted(name, CITY_ADCODE, petId, totalDays, transportMode)))
			.andExpect(status().isCreated())
			.andReturn();
		return JSON_MAPPER.readTree(result.getResponse().getContentAsString()).path("id").asLong();
	}

	private JsonNode generate(long tripId, String owner, ResultMatcher expectedStatus) throws Exception {
		MvcResult result = this.mockMvc.perform(post("/api/trips/{tripId}/packing-checklist", tripId)
					.with(user(owner))
					.with(csrf()))
			.andExpect(expectedStatus)
			.andReturn();
		return JSON_MAPPER.readTree(result.getResponse().getContentAsString());
	}

	private JsonNode read(long tripId) throws Exception {
		MvcResult result = this.mockMvc.perform(get("/api/trips/{tripId}/packing-checklist", tripId)
					.with(user(this.username)))
			.andExpect(status().isOk())
			.andReturn();
		return JSON_MAPPER.readTree(result.getResponse().getContentAsString());
	}

	private void updateTrip(long tripId, String name, int totalDays, String transportMode) throws Exception {
		this.mockMvc.perform(put("/api/trips/{tripId}", tripId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"%s","totalDays":%d,"plan":%s,"transportMode":"%s"}
							""".formatted(name, totalDays, EMPTY_PLAN, transportMode)))
			.andExpect(status().isOk());
	}

	private void updatePet(String name, PetType type, double weightKg, double shoulderHeightCm, boolean hasLeash,
			boolean hasVaccinationProof) throws Exception {
		this.mockMvc.perform(put("/api/pets/{petId}", this.petId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("""
							{"name":"%s","petType":"%s","weightKg":%s,"shoulderHeightCm":%s,
							 "hasLeash":%s,"hasVaccinationProof":%s}
							""".formatted(name, type.name(), weightKg, shoulderHeightCm, hasLeash, hasVaccinationProof)))
			.andExpect(status().isOk());
	}

	private void checkItem(long tripId, long itemId, boolean checked) throws Exception {
		this.mockMvc.perform(put("/api/trips/{tripId}/packing-checklist/items/{itemId}", tripId, itemId)
					.with(user(this.username))
					.with(csrf())
					.contentType(MediaType.APPLICATION_JSON)
					.content("{\"checked\":" + checked + "}"))
			.andExpect(status().isOk());
	}

	private void deletePetDirectly(long id) throws SQLException {
		try (Connection connection = DriverManager.getConnection("jdbc:sqlite:" + DB_PATH);
				Statement statement = connection.createStatement()) {
			statement.executeUpdate("DELETE FROM pet WHERE id = " + id);
		}
	}

	private static JsonNode item(JsonNode checklist, String templateKey) {
		if (templateKey == null) {
			return null;
		}
		for (JsonNode candidate : checklist.path("items")) {
			if (templateKey.equals(candidate.path("templateKey").asText())) {
				return candidate;
			}
		}
		return null;
	}

	private static JsonNode item(JsonNode checklist, String templateKey, long id) {
		for (JsonNode candidate : checklist.path("items")) {
			if (candidate.path("id").asLong() == id) {
				return candidate;
			}
		}
		return null;
	}

	private static List<String> names(JsonNode checklist) {
		List<String> names = new ArrayList<>();
		for (JsonNode candidate : checklist.path("items")) {
			names.add(candidate.path("name").asText());
		}
		return names;
	}

	private static List<Long> ids(JsonNode checklist) {
		List<Long> ids = new ArrayList<>();
		for (JsonNode candidate : checklist.path("items")) {
			ids.add(candidate.path("id").asLong());
		}
		return ids;
	}

}
