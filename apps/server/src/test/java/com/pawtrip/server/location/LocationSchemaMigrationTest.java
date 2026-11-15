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
			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery("SELECT COUNT(*) FROM location_photo")) {
				assertThat(result.next()).isTrue();
				assertThat(result.getInt(1)).isZero();
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
