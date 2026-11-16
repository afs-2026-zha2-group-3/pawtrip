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

class DogBreedSchemaMigrationTest {

	@Test
	void seedsCommonDogBreeds(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("seeded-dog-breeds.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(count(connection, "SELECT COUNT(*) FROM dog_breed")).isEqualTo(20);
			assertThat(count(connection,
					"SELECT COUNT(*) FROM dog_breed WHERE official_aggressive = 1")).isEqualTo(9);
			assertThat(count(connection,
					"SELECT COUNT(*) FROM dog_breed WHERE official_aggressive = 0")).isEqualTo(11);
			assertThat(officialAggressive(connection, "藏獒")).isEqualTo(1);
			assertThat(officialAggressive(connection, "中华田园犬")).isEqualTo(1);
			assertThat(officialAggressive(connection, "金毛寻回犬")).isZero();
		}
	}

	@Test
	void createsDogBreedAndCityAllowedDogBreedTables(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("dog-breeds.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).target("10").load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			insertRegion(connection, "990000", null, "province");
			insertRegion(connection, "990001", "990000", "city");
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "dog_breed"))
				.containsExactlyInAnyOrder("id", "name", "official_aggressive");
			assertThat(columns(connection, "city_allowed_dog_breed"))
				.containsExactlyInAnyOrder("adcode", "dog_breed_id");

			long pastoralDogId = insertDogBreed(connection, "测试牧羊犬", 0);
			long tibetanMastiffId = insertDogBreed(connection, "测试獒犬", 1);
			insertCityAllowedDogBreed(connection, "990001", pastoralDogId);
			insertCityAllowedDogBreed(connection, "990001", tibetanMastiffId);

			assertThat(countCityAllowedDogBreeds(connection, "990001")).isEqualTo(2);
			assertThat(selectOfficialAggressive(connection, tibetanMastiffId)).isEqualTo(1);
		}
	}

	@Test
	void rejectsInvalidDogBreedValuesAndUnknownReferences(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("dog-breed-constraints.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			insertRegion(connection, "990000", null, "province");
			insertRegion(connection, "990001", "990000", "city");
			long breedId = insertDogBreed(connection, "测试犬种", 0);

			assertThatThrownBy(() -> insertDogBreed(connection, "测试犬种", 0))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertDogBreed(connection, "  ", 0)).isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertDogBreed(connection, "无效标记测试犬种", 2))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertDogBreedWithoutOfficialFlag(connection, "缺少标记测试犬种"))
				.isInstanceOf(SQLException.class);

			insertCityAllowedDogBreed(connection, "990001", breedId);
			assertThatThrownBy(() -> insertCityAllowedDogBreed(connection, "990001", breedId))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertCityAllowedDogBreed(connection, "990001", breedId + 100))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertCityAllowedDogBreed(connection, "999999", breedId))
				.isInstanceOf(SQLException.class);
		}
	}

	@Test
	void deletesAllowedBreedLinksWithTheBreedOrTheRegion(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("dog-breed-cascade.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			insertRegion(connection, "990000", null, "province");
			insertRegion(connection, "990001", "990000", "city");
			long firstBreedId = insertDogBreed(connection, "测试犬种一", 0);
			long secondBreedId = insertDogBreed(connection, "测试犬种二", 1);
			insertCityAllowedDogBreed(connection, "990001", firstBreedId);
			insertCityAllowedDogBreed(connection, "990001", secondBreedId);

			deleteById(connection, "dog_breed", "id", firstBreedId);
			assertThat(countCityAllowedDogBreeds(connection, "990001")).isEqualTo(1);

			deleteById(connection, "administrative_region", "adcode", "990001");
			assertThat(countCityAllowedDogBreeds(connection, "990001")).isZero();
		}
	}

	private static void insertRegion(Connection connection, String adcode, String parentAdcode, String level)
			throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO administrative_region (adcode, name, level, parent_adcode) VALUES (?, ?, ?, ?)")) {
			insert.setString(1, adcode);
			insert.setString(2, "Test region");
			insert.setString(3, level);
			if (parentAdcode == null) {
				insert.setNull(4, java.sql.Types.VARCHAR);
			}
			else {
				insert.setString(4, parentAdcode);
			}
			insert.executeUpdate();
		}
	}

	private static long insertDogBreed(Connection connection, String name, int officialAggressive)
			throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO dog_breed (name, official_aggressive) VALUES (?, ?)",
				Statement.RETURN_GENERATED_KEYS)) {
			insert.setString(1, name);
			insert.setInt(2, officialAggressive);
			insert.executeUpdate();
			try (ResultSet keys = insert.getGeneratedKeys()) {
				assertThat(keys.next()).isTrue();
				return keys.getLong(1);
			}
		}
	}

	private static void insertDogBreedWithoutOfficialFlag(Connection connection, String name) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement("INSERT INTO dog_breed (name) VALUES (?)")) {
			insert.setString(1, name);
			insert.executeUpdate();
		}
	}

	private static void insertCityAllowedDogBreed(Connection connection, String adcode, long dogBreedId)
			throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO city_allowed_dog_breed (adcode, dog_breed_id) VALUES (?, ?)")) {
			insert.setString(1, adcode);
			insert.setLong(2, dogBreedId);
			insert.executeUpdate();
		}
	}

	private static int selectOfficialAggressive(Connection connection, long dogBreedId) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT official_aggressive FROM dog_breed WHERE id = ?")) {
			query.setLong(1, dogBreedId);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getInt("official_aggressive");
			}
		}
	}

	private static int officialAggressive(Connection connection, String name) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT official_aggressive FROM dog_breed WHERE name = ?")) {
			query.setString(1, name);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getInt("official_aggressive");
			}
		}
	}

	private static int count(Connection connection, String sql) throws SQLException {
		try (Statement statement = connection.createStatement();
				ResultSet result = statement.executeQuery(sql)) {
			assertThat(result.next()).isTrue();
			return result.getInt(1);
		}
	}

	private static int countCityAllowedDogBreeds(Connection connection, String adcode) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT COUNT(*) FROM city_allowed_dog_breed WHERE adcode = ?")) {
			query.setString(1, adcode);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getInt(1);
			}
		}
	}

	private static void deleteById(Connection connection, String table, String idColumn, Object id)
			throws SQLException {
		try (PreparedStatement delete = connection.prepareStatement(
				"DELETE FROM " + table + " WHERE " + idColumn + " = ?")) {
			delete.setObject(1, id);
			delete.executeUpdate();
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
