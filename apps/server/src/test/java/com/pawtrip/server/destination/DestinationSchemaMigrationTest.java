package com.pawtrip.server.destination;

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

class DestinationSchemaMigrationTest {

	@Test
	void addsCoverageFlagDefaultingExistingRowsToFalse(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("existing-destination-flags.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("7").load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl);
				Statement statement = connection.createStatement()) {
			statement.executeUpdate(
					"INSERT INTO administrative_region (adcode, name, level) "
							+ "VALUES ('990003', 'Legacy city', 'province')");
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "administrative_region")).contains("policy_covered");
			assertCovered(connection, "990003", 0);
			assertCovered(connection, "330100", 1);
			assertCovered(connection, "440400", 1);
			assertCovered(connection, "330200", 0);

			assertThatThrownBy(() -> updateFlag(connection, "990003", "policy_covered", 2))
				.isInstanceOf(SQLException.class);
		}
	}

	@Test
	void seedsBannedBreedListsWithSourceAndUpdatedPerEntry(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("destination-seeds.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(breedCount(connection, "330100")).isEqualTo(33);
			assertThat(breedCount(connection, "440400")).isEqualTo(38);

			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery(
							"SELECT breed_name, source, updated FROM region_banned_breed")) {
				while (result.next()) {
					assertThat(result.getString("breed_name")).isNotBlank();
					assertThat(result.getString("source")).isNotBlank();
					assertThat(result.getString("updated")).matches("\\d{4}-\\d{2}-\\d{2}");
				}
			}

			assertThat(breedSource(connection, "330100", "比特犬")).contains("杭州市限制养犬规定");
			assertThat(breedUpdated(connection, "330100", "日本土佐")).isEqualTo("2007-08-13");
			assertThat(breedSource(connection, "440400", "比特犬")).contains("危险犬标准及品种的通告");
			assertThat(breedUpdated(connection, "440400", "日本土佐")).isEqualTo("2021-03-01");
		}
	}

	@Test
	void enforcesBannedBreedForeignKeyUniqueNameAndCascade(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("destination-constraints.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThatThrownBy(() -> insertBreed(connection, "999999", "比特犬"))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertBreed(connection, "330100", "比特犬"))
				.isInstanceOf(SQLException.class);

			try (Statement statement = connection.createStatement()) {
				statement.executeUpdate(
						"INSERT INTO administrative_region (adcode, name, level) "
								+ "VALUES ('990004', 'Cascade city', 'province')");
			}
			insertBreed(connection, "990004", "测试犬种");
			try (PreparedStatement delete = connection.prepareStatement(
					"DELETE FROM administrative_region WHERE adcode = ?")) {
				delete.setString(1, "990004");
				delete.executeUpdate();
			}
			assertThat(breedCount(connection, "990004")).isZero();
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

	private static void assertCovered(Connection connection, String adcode, int covered) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT policy_covered FROM administrative_region WHERE adcode = ?")) {
			query.setString(1, adcode);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				assertThat(result.getInt("policy_covered")).isEqualTo(covered);
			}
		}
	}

	private static void updateFlag(Connection connection, String adcode, String column, int value)
			throws SQLException {
		try (PreparedStatement update = connection.prepareStatement(
				"UPDATE administrative_region SET " + column + " = ? WHERE adcode = ?")) {
			update.setInt(1, value);
			update.setString(2, adcode);
			update.executeUpdate();
		}
	}

	private static int breedCount(Connection connection, String adcode) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT COUNT(*) FROM region_banned_breed WHERE region_adcode = ?")) {
			query.setString(1, adcode);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getInt(1);
			}
		}
	}

	private static String breedSource(Connection connection, String adcode, String breedName) throws SQLException {
		return breedField(connection, adcode, breedName, "source");
	}

	private static String breedUpdated(Connection connection, String adcode, String breedName) throws SQLException {
		return breedField(connection, adcode, breedName, "updated");
	}

	private static String breedField(Connection connection, String adcode, String breedName, String field)
			throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT " + field + " FROM region_banned_breed WHERE region_adcode = ? AND breed_name = ?")) {
			query.setString(1, adcode);
			query.setString(2, breedName);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getString(1);
			}
		}
	}

	private static void insertBreed(Connection connection, String adcode, String breedName) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO region_banned_breed (region_adcode, breed_name, source, updated) "
						+ "VALUES (?, ?, 'test source', '2026-01-01')")) {
			insert.setString(1, adcode);
			insert.setString(2, breedName);
			insert.executeUpdate();
		}
	}

}