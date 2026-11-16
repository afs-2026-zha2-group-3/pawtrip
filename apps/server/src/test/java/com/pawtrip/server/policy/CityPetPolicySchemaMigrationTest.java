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
import java.util.HashSet;
import java.util.Set;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

class CityPetPolicySchemaMigrationTest {

	private static final JsonMapper JSON = JsonMapper.builder().build();

	private static final String[] POLICY_COLUMNS = {
		"adcode",
		"area_scope",
		"policies_json",
		"banned_breeds",
		"source_title",
		"source_note",
		"updated_month",
		"created_at"
	};

	@Test
	void createsPolicyTableAndSeedsZhuhaiWithUncoveredCitiesLeftEmpty(@TempDir Path tempDir) throws Exception {
		String jdbcUrl = jdbcUrl(tempDir.resolve("city-pet-policy.db"));
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "city_pet_policy")).containsExactlyInAnyOrder(POLICY_COLUMNS);

			try (PreparedStatement query = connection.prepareStatement(
					"SELECT area_scope, policies_json, banned_breeds, source_title, source_note, updated_month "
							+ "FROM city_pet_policy WHERE adcode = ?")) {
				query.setString(1, "440400");
				try (ResultSet result = query.executeQuery()) {
					assertThat(result.next()).isTrue();
					assertThat(result.getString("area_scope")).isEqualTo("严格管理区");
					assertThat(result.getString("source_title")).isNotBlank();
					assertThat(result.getString("updated_month")).matches("\\d{4}-\\d{2}");

					JsonNode policies = JSON.readTree(result.getString("policies_json"));
					assertThat(policies.isArray()).isTrue();
					assertThat(policies.size()).isGreaterThan(0);

					JsonNode banned = JSON.readTree(result.getString("banned_breeds"));
					assertThat(banned.isArray()).isTrue();
					assertThat(banned.size()).isGreaterThanOrEqualTo(38);
					assertThat(breedNames(banned)).contains("比特斗牛梗犬", "波音达犬", "斗牛犬", "凯丽蓝梗犬");
					assertThat(breedNames(banned)).doesNotContain("法国斗牛犬");
					assertThat(result.next()).isFalse();
				}
			}

			assertThat(countPolicies(connection, "440300")).isZero();
		}
	}

	@Test
	void enforcesRegionForeignKeyAndUpdatedMonthFormat(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = jdbcUrl(tempDir.resolve("city-pet-policy-constraints.db"));
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "city_pet_policy")).contains("adcode");
			assertThatThrownBy(() -> insertPolicy(connection, "999999", "2025-07"))
				.isInstanceOf(SQLException.class);
			assertThatThrownBy(() -> insertPolicy(connection, "440300", "2025/07"))
				.isInstanceOf(SQLException.class);

			insertPolicy(connection, "440300", "2025-07");
			assertThat(countPolicies(connection, "440300")).isEqualTo(1);
		}
	}

	@Test
	void addsPolicyTableOnUpgradeWithoutChangingExistingRegions(@TempDir Path tempDir) throws SQLException {
		String jdbcUrl = jdbcUrl(tempDir.resolve("existing-city-pet-policy.db"));
		Flyway.configure().dataSource(jdbcUrl, null, null).target("7").load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "city_pet_policy")).isEmpty();
			try (Statement statement = connection.createStatement();
					ResultSet result = statement.executeQuery(
							"SELECT name FROM administrative_region WHERE adcode = '440400'")) {
				assertThat(result.next()).isTrue();
				assertThat(result.getString("name")).isEqualTo("珠海市");
			}
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl)) {
			assertThat(columns(connection, "city_pet_policy")).contains("adcode", "banned_breeds");
			assertThat(countPolicies(connection, "440400")).isEqualTo(1);
		}
	}

	private static String jdbcUrl(Path databasePath) {
		return "jdbc:sqlite:" + databasePath + "?foreign_keys=on";
	}

	private static Set<String> breedNames(JsonNode banned) {
		Set<String> names = new HashSet<>();
		banned.forEach((node) -> names.add(node.asString()));
		return names;
	}

	private static int countPolicies(Connection connection, String adcode) throws SQLException {
		try (PreparedStatement query = connection.prepareStatement(
				"SELECT COUNT(*) FROM city_pet_policy WHERE adcode = ?")) {
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
				"INSERT INTO city_pet_policy (adcode, area_scope, policies_json, banned_breeds, source_title, "
						+ "source_note, updated_month) VALUES (?, ?, ?, ?, ?, ?, ?)")) {
			insert.setString(1, adcode);
			insert.setString(2, "严格管理区");
			insert.setString(3, "[\"禁止饲养危险犬\"]");
			insert.setString(4, "[\"比特斗牛梗犬\"]");
			insert.setString(5, "测试来源");
			insert.setString(6, null);
			insert.setString(7, updatedMonth);
			insert.executeUpdate();
		}
	}

}
