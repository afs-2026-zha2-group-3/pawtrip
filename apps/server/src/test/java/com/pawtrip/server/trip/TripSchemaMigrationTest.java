package com.pawtrip.server.trip;

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

class TripSchemaMigrationTest {

	@Test
	void createsTripTableWithForeignKeysDefaultsAndIndex(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("trip-schema.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "trip")).containsExactlyInAnyOrder(
					"id", "user_id", "name", "city_adcode", "pet_id", "total_days", "plan_json", "created_at",
					"updated_at");
			assertThat(indexNames(connection, "trip")).contains("idx_trip_user_id");

			long userId = insertUser(connection, "trip-owner");
			long petId = insertPet(connection, userId);
			long tripId = insertTrip(connection, userId, petId, "杭州周末", 3);

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT plan_json FROM trip WHERE id = ?")) {
				query.setLong(1, tripId);
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getString("plan_json"))
						.isEqualTo("{\"version\":1,\"days\":[],\"unscheduled\":[]}");
				}
			}

			assertThatThrownBy(() -> insertTrip(connection, userId, petId, "Zero days", 0))
				.isInstanceOf(SQLException.class);

			try (PreparedStatement delete = connection.prepareStatement("DELETE FROM pet WHERE id = ?")) {
				delete.setLong(1, petId);
				assertThatThrownBy(delete::executeUpdate).isInstanceOf(SQLException.class);
			}

			try (PreparedStatement delete = connection.prepareStatement("DELETE FROM app_user WHERE id = ?")) {
				delete.setLong(1, userId);
				delete.executeUpdate();
			}

			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery("SELECT COUNT(*) FROM trip")) {
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

	private static long insertPet(Connection connection, long userId) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO pet (user_id, name, pet_type, weight_kg, shoulder_height_cm, has_leash, "
						+ "has_vaccination_proof) VALUES (?, 'Mimi', 'CAT', 4.5, 25.0, 1, 1)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setLong(1, userId);
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				return keys.getLong(1);
			}
		}
	}

	private static long insertTrip(Connection connection, long userId, long petId, String name, int totalDays)
			throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO trip (user_id, name, city_adcode, pet_id, total_days) "
						+ "VALUES (?, ?, '330100', ?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setLong(1, userId);
			insert.setString(2, name);
			insert.setLong(3, petId);
			insert.setInt(4, totalDays);
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

	private static Set<String> indexNames(Connection connection, String table) throws SQLException {
		Set<String> indexes = new HashSet<>();
		try (Statement statement = connection.createStatement();
				ResultSet result = statement.executeQuery("PRAGMA index_list('" + table + "')")) {
			while (result.next()) {
				indexes.add(result.getString("name"));
			}
		}
		return indexes;
	}

}
