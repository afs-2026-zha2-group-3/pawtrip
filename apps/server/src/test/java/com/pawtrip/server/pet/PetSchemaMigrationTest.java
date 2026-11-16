package com.pawtrip.server.pet;

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

class PetSchemaMigrationTest {

	@Test
	void createsPetTableForExistingUsers(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("existing-users.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("7").load().migrate();

		long userId;
		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			userId = insertUser(connection, "pet-owner");
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "pet")).containsExactlyInAnyOrder(
					"id", "user_id", "name", "pet_type", "weight_kg", "shoulder_height_cm", "has_leash",
					"has_vaccination_proof", "photo");

			long catId = insertPet(connection, userId, "Mimi", "CAT", 4.5, 25.0, 1, 1);
			insertPet(connection, userId, "Rex", "DOG", 18.25, 60.0, 0, 0);
			try (PreparedStatement update = connection.prepareStatement(
					"UPDATE pet SET photo = ? WHERE id = ?")) {
				update.setBytes(1, new byte[] {1, 2, 3});
				update.setLong(2, catId);
				update.executeUpdate();
			}

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT name, pet_type, weight_kg, shoulder_height_cm, has_leash, has_vaccination_proof, photo "
							+ "FROM pet WHERE id = ?")) {
				query.setLong(1, catId);
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getString("name")).isEqualTo("Mimi");
					assertThat(result.getString("pet_type")).isEqualTo("CAT");
					assertThat(result.getDouble("weight_kg")).isEqualTo(4.5);
					assertThat(result.getDouble("shoulder_height_cm")).isEqualTo(25.0);
					assertThat(result.getInt("has_leash")).isEqualTo(1);
					assertThat(result.getInt("has_vaccination_proof")).isEqualTo(1);
					assertThat(result.getBytes("photo")).containsExactly(new byte[] {1, 2, 3});
				}
			}

			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery(
							"SELECT COUNT(*) FROM pet WHERE user_id = " + userId)) {
				assertThat(result.next()).isTrue();
				assertThat(result.getInt(1)).isEqualTo(2);
			}
		}
	}

	@Test
	void addsNullablePhotoWithoutChangingExistingPets(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("existing-pets.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("11").load().migrate();

		long petId;
		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			long userId = insertUser(connection, "existing-pet-owner");
			petId = insertPet(connection, userId, "Mimi", "CAT", 4.5, 25.0, 1, 1);
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "pet")).contains("photo");

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT photo FROM pet WHERE id = ?")) {
				query.setLong(1, petId);
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getBytes("photo")).isNull();
				}
			}
		}
	}

	@Test
	void rejectsInvalidPetValuesAndRequiresAnExistingUser(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("pet-constraints.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			long userId = insertUser(connection, "pet-owner");

			assertThatThrownBy(() -> insertPet(connection, userId, "Mimi", "FISH", 1.0, 10.0, 1, 1))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPet(connection, userId, "Mimi", "CAT", 0.0, 10.0, 1, 1))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPet(connection, userId, "Mimi", "CAT", 1.0, 0.0, 1, 1))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPet(connection, userId, "Mimi", "CAT", 1.0, -1.0, 1, 1))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPet(connection, userId, "  ", "CAT", 1.0, 10.0, 1, 1))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPet(connection, userId, "Mimi", "CAT", 1.0, 10.0, 2, 1))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPet(connection, userId, "Rex", "DOG", 1.0, 10.0, 1, -1))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPet(connection, userId + 100, "Rex", "DOG", 1.0, 10.0, 1, 1))
				.isInstanceOf(SQLException.class);
		}
	}

	@Test
	void deletesPetsWhenTheOwnerIsDeleted(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("pet-cascade.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			long userId = insertUser(connection, "pet-owner");
			insertPet(connection, userId, "Mimi", "CAT", 3.0, 25.0, 1, 1);

			try (PreparedStatement delete = connection.prepareStatement("DELETE FROM app_user WHERE id = ?")) {
				delete.setLong(1, userId);
				delete.executeUpdate();
			}

			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery("SELECT COUNT(*) FROM pet")) {
				assertThat(result.next()).isTrue();
				assertThat(result.getInt(1)).isZero();
			}
		}
	}

	private static long insertUser(Connection connection, String username) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO app_user (username, password_hash, enabled) VALUES (?, 'hash', 1)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setString(1, username);
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				return keys.getLong(1);
			}
		}
	}

	private static long insertPet(Connection connection, long userId, String name, String petType, double weightKg,
			double shoulderHeightCm, int hasLeash, int hasVaccinationProof) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO pet (user_id, name, pet_type, weight_kg, shoulder_height_cm, has_leash, "
						+ "has_vaccination_proof) VALUES (?, ?, ?, ?, ?, ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setLong(1, userId);
			insert.setString(2, name);
			insert.setString(3, petType);
			insert.setDouble(4, weightKg);
			insert.setDouble(5, shoulderHeightCm);
			insert.setInt(6, hasLeash);
			insert.setInt(7, hasVaccinationProof);
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

}
