package com.pawtrip.server.policy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class CityPetPolicySchemaMigrationTest {

	private static final String[] POLICY_COLUMNS = {
		"adcode",
		"area_scope",
		"policies_json",
		"source_title",
		"source_note",
		"updated_month",
		"created_at"
	};

	private static final String[] BANNED_BREED_COLUMNS = {"adcode", "dog_breed_id"};

	private static final List<String> ZHUHAI_BANNED_BREEDS = List.of("藏獒", "德国牧羊犬", "罗威纳犬", "杜宾犬",
			"秋田犬", "比特犬", "高加索犬", "卡斯罗犬");

	private static final List<String> CITY_ALLOWED_BREEDS = List.of("金毛寻回犬", "拉布拉多寻回犬", "贵宾犬", "柯基犬",
			"哈士奇", "博美犬", "比熊犬");

	@Test
	void createsPolicyTablesAndSeedsZhuhaiWithUncoveredCitiesLeftEmpty(@TempDir Path tempDir) throws Exception {
		String jdbcUrl = jdbcUrl(tempDir.resolve("city-pet-policy.db"));
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "city_pet_policy")).containsExactlyInAnyOrder(POLICY_COLUMNS);
			assertThat(columns(connection, "city_banned_dog_breed"))
				.containsExactlyInAnyOrder(BANNED_BREED_COLUMNS);

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT area_scope, policies_json, source_title, source_note, updated_month "
							+ "FROM city_pet_policy WHERE adcode = ?")) {
				query.setString(1, "440400");
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getString("area_scope")).isEqualTo("严格管理区");
					assertThat(result.getString("source_title")).isNotBlank();
					assertThat(result.getString("source_note")).contains("公开发布");
					assertThat(result.getString("updated_month")).matches("\\d{4}-\\d{2}");
					assertThat(result.getString("policies_json")).contains("严格管理区内禁止饲养危险犬");
					assertThat(result.next()).isFalse();
				}
			}

			assertThat(bannedBreedNames(connection, "440400")).containsExactlyElementsOf(ZHUHAI_BANNED_BREEDS);
			assertThat(allowedBreedNames(connection, "440400")).containsExactlyElementsOf(CITY_ALLOWED_BREEDS);
			assertThat(countPolicies(connection, "440300")).isZero();
			assertThat(countBannedBreeds(connection, "440300")).isZero();
			assertThat(allowedBreedNames(connection, "440300")).containsExactlyElementsOf(CITY_ALLOWED_BREEDS);
		}
	}

	@Test
	void enforcesForeignKeysAndUpdatedMonthFormat(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = jdbcUrl(tempDir.resolve("city-pet-policy-constraints.db"));
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThatThrownBy(() -> insertPolicy(connection, "999999", "2025-07"))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPolicy(connection, "440300", "2025/07"))
				.isInstanceOf(SQLException.class);

			insertPolicy(connection, "440300", "2025-07");
			assertThat(countPolicies(connection, "440300")).isEqualTo(1);

			assertThatThrownBy(() -> insertBannedBreed(connection, "999999", 18)).isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertBannedBreed(connection, "440300", 999999))
				.isInstanceOf(SQLException.class);

			insertBannedBreed(connection, "440300", 18);
			assertThat(bannedBreedNames(connection, "440300")).containsExactly("比特犬");

			try (PreparedStatement delete = connection.prepareStatement(
					"DELETE FROM city_pet_policy WHERE adcode = ?")) {
				delete.setString(1, "440300");
				delete.executeUpdate();
			}
			assertThat(countBannedBreeds(connection, "440300")).isZero();
		}
	}

	@Test
	void addsPolicyTablesOnUpgradeWithoutChangingExistingRegions(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = jdbcUrl(tempDir.resolve("existing-city-pet-policy.db"));
		Flyway.configure().dataSource(jdbcUrl, null, null).target("14").load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "city_pet_policy")).isEmpty();
			assertThat(columns(connection, "city_banned_dog_breed")).isEmpty();
			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery(
							"SELECT name FROM administrative_region WHERE adcode = '440400'")) {
				assertThat(result.next()).isTrue();
				assertThat(result.getString("name")).isEqualTo("珠海市");
			}
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "city_pet_policy")).contains("adcode");
			assertThat(columns(connection, "city_banned_dog_breed")).contains("dog_breed_id");
			assertThat(countPolicies(connection, "440400")).isEqualTo(1);
			assertThat(bannedBreedNames(connection, "440400")).hasSize(8);
			assertThat(allowedBreedNames(connection, "440400")).containsExactlyElementsOf(CITY_ALLOWED_BREEDS);
		}
	}

	private static String jdbcUrl(Path databasePath) {
		return "jdbc:sqlite:" + databasePath + "?foreign_keys=on";
	}

	private static List<String> bannedBreedNames(Connection connection, String adcode) throws SQLException {
		return breedNames(connection, "city_banned_dog_breed", adcode);
	}

	private static List<String> allowedBreedNames(Connection connection, String adcode) throws SQLException {
		return breedNames(connection, "city_allowed_dog_breed", adcode);
	}

	private static List<String> breedNames(Connection connection, String table, String adcode) throws SQLException {
		List<String> names = new ArrayList<>();
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT b.name FROM " + table + " c JOIN dog_breed b ON b.id = c.dog_breed_id "
						+ "WHERE c.adcode = ? ORDER BY b.id")) {
			query.setString(1, adcode);
			try (ResultSet result = query.executeQuery()) {
				while (result.next()) {
					names.add(result.getString("name"));
				}
			}
		}
		return names;
	}

	private static int countPolicies(Connection connection, String adcode) throws SQLException {
		return count(connection, "SELECT COUNT(*) FROM city_pet_policy WHERE adcode = ?", adcode);
	}

	private static int countBannedBreeds(Connection connection, String adcode) throws SQLException {
		return count(connection, "SELECT COUNT(*) FROM city_banned_dog_breed WHERE adcode = ?", adcode);
	}

	private static int count(Connection connection, String sql, String adcode) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(sql)) {
			query.setString(1, adcode);
			try (ResultSet result = query.executeQuery()) {
				assertThat(result.next()).isTrue();
				return result.getInt(1);
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

	private static void insertPolicy(Connection connection, String adcode, String updatedMonth) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO city_pet_policy (adcode, area_scope, policies_json, source_title, "
						+ "source_note, updated_month) VALUES (?, ?, ?, ?, ?, ?)")) {
			insert.setString(1, adcode);
			insert.setString(2, "严格管理区");
			insert.setString(3, "[\"禁止饲养危险犬\"]");
			insert.setString(4, "测试来源");
			insert.setString(5, null);
			insert.setString(6, updatedMonth);
			insert.executeUpdate();
		}
	}

	private static void insertBannedBreed(Connection connection, String adcode, long dogBreedId) throws SQLException {
		try (PreparedStatement insert = connection.prepareStatement(
				"INSERT INTO city_banned_dog_breed (adcode, dog_breed_id) VALUES (?, ?)")) {
			insert.setString(1, adcode);
			insert.setLong(2, dogBreedId);
			insert.executeUpdate();
		}
	}

}
