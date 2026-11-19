package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Set;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class LocationSchemaMigrationTest {

	private static final String[] PET_POLICY_COLUMNS = {
		"max_pets_per_person",
		"max_single_pet_weight_kg",
		"leash_required",
		"vaccination_proof_required",
		"extra_fee_cents",
		"reservation_required"
	};

	@Test
	void addsNullablePetPolicyColumnsWithoutChangingExistingRows(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("existing-pet-policies.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("6").load().migrate();

		long locationId;
		try (Connection connection = DriverManager.getConnection(jdbcUrl);
				Statement statement = connection.createStatement()) {
			statement.executeUpdate(
					"INSERT INTO administrative_region (adcode, name, level) "
							+ "VALUES ('990001', 'Test city', 'province')");
			locationId = insertLocation(connection, "poi-existing-policy", null, null);
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "administrative_region")).contains(PET_POLICY_COLUMNS);
			assertThat(columns(connection, "pawtrip_location")).contains(PET_POLICY_COLUMNS);

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT name, max_pets_per_person, max_single_pet_weight_kg, leash_required, "
							+ "vaccination_proof_required, extra_fee_cents, reservation_required "
							+ "FROM administrative_region WHERE adcode = ?")) {
				query.setString(1, "990001");
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getString("name")).isEqualTo("Test city");
					assertPetPolicyIsUnconfigured(result);
				}
			}

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT name, max_pets_per_person, max_single_pet_weight_kg, leash_required, "
							+ "vaccination_proof_required, extra_fee_cents, reservation_required "
							+ "FROM pawtrip_location WHERE id = ?")) {
				query.setLong(1, locationId);
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getString("name")).isEqualTo("Test location");
					assertPetPolicyIsUnconfigured(result);
				}
			}
		}
	}

	@Test
	void storesIndependentPetPoliciesAndRejectsOutOfRangeValues(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("pet-policy-constraints.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			insertRegionWithPetPolicies(connection, "990002", 2, 18.5, 1, 0, 250L, 1);
			insertLocationWithPetPolicies(connection, "poi-pet-policy", 1, 8.75, 0, 1, 50L, 0);

			assertPetPolicy(connection,
					"SELECT max_pets_per_person, max_single_pet_weight_kg, leash_required, "
							+ "vaccination_proof_required, extra_fee_cents, reservation_required "
							+ "FROM administrative_region WHERE adcode = ?",
					"990002", 2, 18.5, 1, 0, 250L, 1);
			assertPetPolicy(connection,
					"SELECT max_pets_per_person, max_single_pet_weight_kg, leash_required, "
							+ "vaccination_proof_required, extra_fee_cents, reservation_required "
							+ "FROM pawtrip_location WHERE poi_id = ?",
					"poi-pet-policy", 1, 8.75, 0, 1, 50L, 0);

			assertPetPolicyValuesRejected(connection, "administrative_region", "adcode", "990002");
			assertPetPolicyValuesRejected(connection, "pawtrip_location", "poi_id", "poi-pet-policy");
		}
	}

	@Test
	void addsNullableAllowedPetTypesWithoutChangingExistingRows(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("allowed-pet-types.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("8").load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			try (Statement statement = connection.createStatement()) {
				statement.executeUpdate(
						"INSERT INTO administrative_region (adcode, name, level) "
								+ "VALUES ('990004', 'Test region', 'province')");
			}
			insertLocation(connection, "poi-allowed-pet-types", null, null);
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "administrative_region")).contains("allowed_pet_types");
			assertThat(columns(connection, "pawtrip_location")).contains("allowed_pet_types");

			assertThat(selectAllowedPetTypes(connection, "administrative_region", "adcode", "990004")).isNull();
			assertThat(selectAllowedPetTypes(connection, "pawtrip_location", "poi_id", "poi-allowed-pet-types"))
				.isNull();

			updateAllowedPetTypes(connection, "administrative_region", "adcode", "990004", "CAT");
			updateAllowedPetTypes(connection, "pawtrip_location", "poi_id", "poi-allowed-pet-types", "CAT,DOG");
			assertThat(selectAllowedPetTypes(connection, "administrative_region", "adcode", "990004"))
				.isEqualTo("CAT");
			assertThat(selectAllowedPetTypes(connection, "pawtrip_location", "poi_id", "poi-allowed-pet-types"))
				.isEqualTo("CAT,DOG");

			assertThatThrownBy(() -> updateAllowedPetTypes(
					connection, "administrative_region", "adcode", "990004", "FISH"))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> updateAllowedPetTypes(
					connection, "pawtrip_location", "poi_id", "poi-allowed-pet-types", "DOG,CAT"))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> updateAllowedPetTypes(
					connection, "pawtrip_location", "poi_id", "poi-allowed-pet-types", ""))
				.isInstanceOf(SQLException.class);
		}
	}

	@Test
	void addsNullableMaxShoulderHeightWithoutChangingExistingRows(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("max-shoulder-height.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("10").load().migrate();

		long locationId;
		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			try (Statement statement = connection.createStatement()) {
				statement.executeUpdate(
						"INSERT INTO administrative_region (adcode, name, level) "
								+ "VALUES ('990005', 'Test region', 'province')");
			}
			locationId = insertLocation(connection, "poi-max-shoulder-height", null, null);
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "administrative_region")).contains("max_single_pet_shoulder_height_cm");
			assertThat(columns(connection, "pawtrip_location")).contains("max_single_pet_shoulder_height_cm");

			assertThat(selectMaxShoulderHeight(connection, "administrative_region", "adcode", "990005")).isNull();
			assertThat(selectMaxShoulderHeight(connection, "pawtrip_location", "id", locationId)).isNull();

			updateMaxShoulderHeight(connection, "administrative_region", "adcode", "990005", 62.5);
			updateMaxShoulderHeight(connection, "pawtrip_location", "id", locationId, 45.0);
			assertThat(selectMaxShoulderHeight(connection, "administrative_region", "adcode", "990005"))
				.isEqualTo(62.5);
			assertThat(selectMaxShoulderHeight(connection, "pawtrip_location", "id", locationId)).isEqualTo(45.0);

			updateMaxShoulderHeight(connection, "administrative_region", "adcode", "990005", null);
			updateMaxShoulderHeight(connection, "pawtrip_location", "id", locationId, null);
			assertThat(selectMaxShoulderHeight(connection, "administrative_region", "adcode", "990005")).isNull();
			assertThat(selectMaxShoulderHeight(connection, "pawtrip_location", "id", locationId)).isNull();

			assertThatThrownBy(
					() -> updateMaxShoulderHeight(connection, "administrative_region", "adcode", "990005", -0.5))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(
					() -> updateMaxShoulderHeight(connection, "pawtrip_location", "id", locationId, -0.5))
				.isInstanceOf(SQLException.class);
		}
	}

	@Test
	void addsNullableDescriptionWithoutChangingExistingRows(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("location-description.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("30").load().migrate();

		long locationId;
		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			locationId = insertLocation(connection, "poi-before-description", null, null);
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "pawtrip_location")).contains("description");
			assertThat(selectDescription(connection, locationId)).isNull();
			assertNotNullConstraint(connection, "description");

			try (PreparedStatement update = connection.prepareStatement(
					"UPDATE pawtrip_location SET description = ? WHERE id = ?")) {
				update.setString(1, "沿着海边步道慢慢走。");
				update.setLong(2, locationId);
				update.executeUpdate();
			}
			assertThat(selectDescription(connection, locationId)).isEqualTo("沿着海边步道慢慢走。");
		}
	}

	@Test
	void createsLocationTablesAndEnforcesUniquePoiHoursAndPhotoForeignKey(@TempDir Path tempDir)
			throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("locations.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery("PRAGMA foreign_keys")) {
				assertThat(result.next()).isTrue();
				assertThat(result.getInt(1)).isEqualTo(1);
			}

			long locationId = insertLocation(connection, "poi-1", null, null);
			assertThatThrownBy(() -> insertLocation(connection, "poi-1", null, null))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertLocation(connection, "poi-negative", -1, null))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertLocation(connection, "poi-range", 3, 2))
				.isInstanceOf(SQLException.class);

			assertThatThrownBy(() -> insertPhoto(connection, locationId + 100, 0))
				.isInstanceOf(SQLException.class);
			insertPhoto(connection, locationId, 0);
			try (PreparedStatement delete = connection.prepareStatement(
					"DELETE FROM pawtrip_location WHERE id = ?")) {
				delete.setLong(1, locationId);
				delete.executeUpdate();
			}
			try (PreparedStatement query = connection.prepareStatement(
					"SELECT COUNT(*) FROM location_photo WHERE location_id = ?")) {
				query.setLong(1, locationId);
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getInt(1)).isZero();
				}
			}
		}
	}

	@Test
	void removesPhotoBinaryColumnsAndPreservesMetadataForExistingDatabases(@TempDir Path tempDir)
			throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("existing-location-photos.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("5").load().migrate();

		long locationId;
		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			locationId = insertLocation(connection, "poi-existing-photo", null, null);
			try (PreparedStatement insert = connection.prepareStatement(
					"INSERT INTO location_photo (location_id, photo_order, source_json, title, source_url, status, "
							+ "media_type, content, error_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")) {
				insert.setLong(1, locationId);
				insert.setInt(2, 0);
				insert.setString(3, "{\"url\":\"https://example.test/photo.jpg\",\"future\":true}");
				insert.setString(4, "Existing photo");
				insert.setString(5, "https://example.test/photo.jpg");
				insert.setString(6, "SAVED");
				insert.setString(7, "image/jpeg");
				insert.setBytes(8, new byte[] {1, 2, 3});
				insert.setNull(9, java.sql.Types.VARCHAR);
				insert.executeUpdate();
			}
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			Set<String> columns = new HashSet<>();
			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery("PRAGMA table_info(location_photo)")) {
				while (result.next()) {
					columns.add(result.getString("name"));
				}
			}
			assertThat(columns).containsExactlyInAnyOrder(
					"id", "location_id", "photo_order", "source_json", "title", "source_url");

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT source_json, title, source_url FROM location_photo WHERE location_id = ?")) {
				query.setLong(1, locationId);
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getString("source_json"))
							.isEqualTo("{\"url\":\"https://example.test/photo.jpg\",\"future\":true}");
					assertThat(result.getString("title")).isEqualTo("Existing photo");
					assertThat(result.getString("source_url")).isEqualTo("https://example.test/photo.jpg");
					assertThat(result.next()).isFalse();
				}
			}

			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery("PRAGMA foreign_key_check")) {
				assertThat(result.next()).isFalse();
			}
		}
	}

	private static long insertLocation(Connection connection, String poiId, Integer minHours, Integer maxHours)
			throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO pawtrip_location (poi_id, name, type_code, type_group, poi_json, business_json, "
						+ "min_visit_hours, max_visit_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setString(1, poiId);
			insert.setString(2, "Test location");
			insert.setString(3, "110000");
			insert.setString(4, "attraction");
			insert.setString(5, "{}");
			insert.setString(6, "{}");
			if (minHours == null) {
				insert.setNull(7, java.sql.Types.INTEGER);
			}
			else {
				insert.setInt(7, minHours);
			}
			if (maxHours == null) {
				insert.setNull(8, java.sql.Types.INTEGER);
			}
			else {
				insert.setInt(8, maxHours);
			}
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				return keys.getLong(1);
			}
		}
	}

	private static Set<String> columns(Connection connection, String table) throws SQLException {
		Set<String> columns = new HashSet<>();
		try (Statement statement = connection.createStatement();
				ResultSet result = statement.executeQuery("PRAGMA table_info(" + table + ")")) {
			while (result.next()) {
				columns.add(result.getString("name"));
			}
		}
		return columns;
	}

	private static String selectDescription(Connection connection, long locationId) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT description FROM pawtrip_location WHERE id = ?")) {
			query.setLong(1, locationId);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getString("description");
			}
		}
	}

	private static void assertNotNullConstraint(Connection connection, String columnName) throws SQLException {
		try (Statement statement = connection.createStatement();
				ResultSet result = statement.executeQuery("PRAGMA table_info(pawtrip_location)")) {
			boolean found = false;
			while (result.next()) {
				if (columnName.equals(result.getString("name"))) {
					found = true;
					assertThat(result.getInt("notnull")).isZero();
				}
			}
			assertThat(found).isTrue();
		}
	}

	private static String selectAllowedPetTypes(Connection connection, String table, String idColumn, String id)
			throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT allowed_pet_types FROM " + table + " WHERE " + idColumn + " = ?")) {
			query.setString(1, id);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getString("allowed_pet_types");
			}
		}
	}

	private static void updateAllowedPetTypes(Connection connection, String table, String idColumn, String id,
			String value) throws SQLException {
		try (PreparedStatement update = connection.prepareStatement(
				"UPDATE " + table + " SET allowed_pet_types = ? WHERE " + idColumn + " = ?")) {
			update.setString(1, value);
			update.setString(2, id);
			update.executeUpdate();
		}
	}

	private static Double selectMaxShoulderHeight(Connection connection, String table, String idColumn, Object id)
			throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT max_single_pet_shoulder_height_cm FROM " + table + " WHERE " + idColumn + " = ?")) {
			query.setObject(1, id);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				double value = result.getDouble("max_single_pet_shoulder_height_cm");
				return result.wasNull() ? null : value;
			}
		}
	}

	private static void updateMaxShoulderHeight(Connection connection, String table, String idColumn, Object id,
			Double value) throws SQLException {
		try (PreparedStatement update = connection.prepareStatement(
				"UPDATE " + table + " SET max_single_pet_shoulder_height_cm = ? WHERE " + idColumn + " = ?")) {
			if (value == null) {
				update.setNull(1, java.sql.Types.REAL);
			}
			else {
				update.setDouble(1, value);
			}
			update.setObject(2, id);
			update.executeUpdate();
		}
	}

	private static void assertPetPolicyIsUnconfigured(ResultSet result) throws SQLException {		assertThat(result.getObject("max_pets_per_person")).isNull();
		assertThat(result.getObject("max_single_pet_weight_kg")).isNull();
		assertThat(result.getObject("leash_required")).isNull();
		assertThat(result.getObject("vaccination_proof_required")).isNull();
		assertThat(result.getObject("extra_fee_cents")).isNull();
		assertThat(result.getObject("reservation_required")).isNull();
	}

	private static void insertRegionWithPetPolicies(Connection connection, String adcode, int maxPets,
			double maxWeightKg, int leashRequired, int vaccinationProofRequired, long extraFeeCents,
			int reservationRequired) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO administrative_region (adcode, name, level, max_pets_per_person, "
						+ "max_single_pet_weight_kg, leash_required, vaccination_proof_required, "
						+ "extra_fee_cents, reservation_required) VALUES (?, ?, 'province', ?, ?, ?, ?, ?, ?)")) {
			insert.setString(1, adcode);
			insert.setString(2, "Test region");
			insert.setInt(3, maxPets);
			insert.setDouble(4, maxWeightKg);
			insert.setInt(5, leashRequired);
			insert.setInt(6, vaccinationProofRequired);
			insert.setLong(7, extraFeeCents);
			insert.setInt(8, reservationRequired);
			insert.executeUpdate();
		}
	}

	private static void insertLocationWithPetPolicies(Connection connection, String poiId, int maxPets,
			double maxWeightKg, int leashRequired, int vaccinationProofRequired, long extraFeeCents,
			int reservationRequired) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO pawtrip_location (poi_id, name, type_code, type_group, poi_json, business_json, "
						+ "max_pets_per_person, max_single_pet_weight_kg, leash_required, "
						+ "vaccination_proof_required, extra_fee_cents, reservation_required) "
						+ "VALUES (?, 'Test location', '110000', 'attraction', '{}', '{}', ?, ?, ?, ?, ?, ?)")) {
			insert.setString(1, poiId);
			insert.setInt(2, maxPets);
			insert.setDouble(3, maxWeightKg);
			insert.setInt(4, leashRequired);
			insert.setInt(5, vaccinationProofRequired);
			insert.setLong(6, extraFeeCents);
			insert.setInt(7, reservationRequired);
			insert.executeUpdate();
		}
	}

	private static void assertPetPolicy(Connection connection, String query, String id, int maxPets,
			double maxWeightKg, int leashRequired, int vaccinationProofRequired, long extraFeeCents,
			int reservationRequired) throws SQLException {
		try (PreparedStatement statement = connection.prepareStatement(query)) {
			statement.setString(1, id);
			try (ResultSet result = statement.executeQuery()) {
				assertThat(result.next()).isTrue();
				assertThat(result.getInt("max_pets_per_person")).isEqualTo(maxPets);
				assertThat(result.getDouble("max_single_pet_weight_kg")).isEqualTo(maxWeightKg);
				assertThat(result.getInt("leash_required")).isEqualTo(leashRequired);
				assertThat(result.getInt("vaccination_proof_required")).isEqualTo(vaccinationProofRequired);
				assertThat(result.getLong("extra_fee_cents")).isEqualTo(extraFeeCents);
				assertThat(result.getInt("reservation_required")).isEqualTo(reservationRequired);
			}
		}
	}

	private static void assertPetPolicyValuesRejected(Connection connection, String table, String idColumn, String id)
			throws SQLException {
		assertRejectedValue(connection, table, idColumn, id, "max_pets_per_person", -1);
		assertRejectedValue(connection, table, idColumn, id, "max_single_pet_weight_kg", -0.5);
		assertRejectedValue(connection, table, idColumn, id, "leash_required", 2);
		assertRejectedValue(connection, table, idColumn, id, "vaccination_proof_required", -1);
		assertRejectedValue(connection, table, idColumn, id, "extra_fee_cents", -1);
		assertRejectedValue(connection, table, idColumn, id, "reservation_required", 3);
	}

	private static void assertRejectedValue(Connection connection, String table, String idColumn, String id,
			String policyColumn, Number invalidValue) throws SQLException {
		String query = "UPDATE " + table + " SET " + policyColumn + " = ? WHERE " + idColumn + " = ?";
		try (PreparedStatement update = connection.prepareStatement(query)) {
			update.setObject(1, invalidValue);
			update.setString(2, id);
			assertThatThrownBy(update::executeUpdate).isInstanceOf(SQLException.class);
		}
	}

	private static void insertPhoto(Connection connection, long locationId, int order) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO location_photo (location_id, photo_order, source_json, source_url) "
						+ "VALUES (?, ?, ?, ?)")) {
			insert.setLong(1, locationId);
			insert.setInt(2, order);
			insert.setString(3, "{}");
			insert.setString(4, "https://example.test/photo.jpg");
			insert.executeUpdate();
		}
	}

}
