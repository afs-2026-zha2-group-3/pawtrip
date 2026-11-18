package com.pawtrip.server.packing;

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

class PackingChecklistSchemaMigrationTest {

	@Test
	void createsChecklistTablesWithConstraintsAndCascade(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("packing-schema.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "trip_packing_checklist")).containsExactlyInAnyOrder(
					"id", "trip_id", "created_at", "updated_at");
			assertThat(columns(connection, "trip_packing_item")).containsExactlyInAnyOrder("id", "checklist_id",
					"category", "name", "quantity", "checked", "source", "template_key", "state",
					"quantity_overridden", "sort_order", "created_at", "updated_at");
			assertThat(indexNames(connection, "trip_packing_item")).contains("uq_packing_item_template",
					"idx_packing_item_checklist");

			long userId = insertUser(connection, "packing-owner");
			long petId = insertPet(connection, userId);
			long tripId = insertTrip(connection, userId, petId);
			long checklistId = insertChecklist(connection, tripId);

			try (PreparedStatement duplicate = connection
				.prepareStatement("INSERT INTO trip_packing_checklist (trip_id) VALUES (?)")) {
				duplicate.setLong(1, tripId);
				assertThatThrownBy(duplicate::executeUpdate).isInstanceOf(SQLException.class);
			}

			insertItem(connection, checklistId, "FOOD", "主粮（份）", 1, "TEMPLATE", "food", "ACTIVE", 1);
			try (PreparedStatement duplicateKey = connection.prepareStatement(
					"INSERT INTO trip_packing_item (checklist_id, category, name, quantity, source, template_key, "
							+ "state, sort_order) VALUES (?, 'FOOD', '重复', 1, 'TEMPLATE', 'food', 'ACTIVE', 2)")) {
				duplicateKey.setLong(1, checklistId);
				assertThatThrownBy(duplicateKey::executeUpdate).isInstanceOf(SQLException.class);
			}

			insertItem(connection, checklistId, "TRAVEL", "宠物雨衣", 1, "CUSTOM", null, "ACTIVE", 2);
			insertItem(connection, checklistId, "TRAVEL", "备用牵引绳", 1, "CUSTOM", null, "ACTIVE", 3);
			assertThat(count(connection, "trip_packing_item")).isEqualTo(3);

			assertThatThrownBy(() -> insertItem(connection, checklistId, "OTHER", "非法分类", 1, "CUSTOM", null,
					"ACTIVE", 4))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertItem(connection, checklistId, "TRAVEL", "零数量", 0, "CUSTOM", null,
					"ACTIVE", 5))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertItem(connection, checklistId, "TRAVEL", "非法来源", 1, "OTHER", null,
					"ACTIVE", 6))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertItem(connection, checklistId, "TRAVEL", "非法状态", 1, "CUSTOM", null,
					"ARCHIVED", 7))
				.isInstanceOf(SQLException.class);

			try (PreparedStatement deleteTrip = connection.prepareStatement("DELETE FROM trip WHERE id = ?")) {
				deleteTrip.setLong(1, tripId);
				deleteTrip.executeUpdate();
			}
			assertThat(count(connection, "trip_packing_checklist")).isZero();
			assertThat(count(connection, "trip_packing_item")).isZero();
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
						+ "has_vaccination_proof) VALUES (?, 'Mimi', 'CAT', 4.5, 25.0, 1, 0)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setLong(1, userId);
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				return keys.getLong(1);
			}
		}
	}

	private static long insertTrip(Connection connection, long userId, long petId) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO trip (user_id, name, city_adcode, pet_id, total_days) "
						+ "VALUES (?, '清单行程', '330100', ?, 3)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setLong(1, userId);
			insert.setLong(2, petId);
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				return keys.getLong(1);
			}
		}
	}

	private static long insertChecklist(Connection connection, long tripId) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO trip_packing_checklist (trip_id) VALUES (?)", Statement.RETURN_GENERATED_KEYS)) {
			insert.setLong(1, tripId);
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				return keys.getLong(1);
			}
		}
	}

	private static void insertItem(Connection connection, long checklistId, String category, String name, int quantity,
			String source, String templateKey, String state, int sortOrder) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO trip_packing_item (checklist_id, category, name, quantity, source, template_key, state, "
						+ "sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")) {
			insert.setLong(1, checklistId);
			insert.setString(2, category);
			insert.setString(3, name);
			insert.setInt(4, quantity);
			insert.setString(5, source);
			if (templateKey == null) {
				insert.setNull(6, java.sql.Types.VARCHAR);
			}
			else {
				insert.setString(6, templateKey);
			}
			insert.setString(7, state);
			insert.setInt(8, sortOrder);
			insert.executeUpdate();
		}
	}

	private static int count(Connection connection, String table) throws SQLException {
		try (Statement statement = connection.createStatement();
				ResultSet result = statement.executeQuery("SELECT COUNT(*) FROM " + table)) {
			assertThat(result.next()).isTrue();
			return result.getInt(1);
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
