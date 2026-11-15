package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AdministrativeRegionMigrationTest {

	@Test
	void seedsOnlyProvincesAndDirectCityChildrenWithValidHierarchy(@TempDir Path tempDir) throws Exception {
		String jdbcUrl = "jdbc:sqlite:" + tempDir.resolve("regions.db") + "?foreign_keys=on";
		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl);
				Statement statement = connection.createStatement()) {
			assertThat(count(statement, "SELECT COUNT(*) FROM administrative_region")).isEqualTo(367);
			assertThat(count(statement, "SELECT COUNT(*) FROM administrative_region WHERE level = 'province'"))
				.isEqualTo(34);
			assertThat(count(statement, "SELECT COUNT(*) FROM administrative_region WHERE level = 'city'"))
				.isEqualTo(333);
			assertThat(count(statement,
					"SELECT COUNT(*) FROM administrative_region WHERE level NOT IN ('province', 'city')"))
				.isZero();
			assertThat(count(statement,
					"SELECT COUNT(*) FROM administrative_region child "
						+ "LEFT JOIN administrative_region parent ON parent.adcode = child.parent_adcode "
						+ "WHERE child.level = 'city' AND parent.level != 'province'"))
				.isZero();
			assertThat(count(statement,
					"SELECT COUNT(*) FROM administrative_region WHERE level = 'province' AND parent_adcode IS NOT NULL"))
				.isZero();
			assertThat(count(statement,
					"SELECT COUNT(*) FROM administrative_region province "
						+ "WHERE province.level = 'province' AND NOT EXISTS ("
						+ "SELECT 1 FROM administrative_region city "
						+ "WHERE city.level = 'city' AND city.parent_adcode = province.adcode)"))
				.isEqualTo(7);
			assertThat(count(statement,
					"SELECT COUNT(DISTINCT adcode) FROM administrative_region"))
				.isEqualTo(367);
			assertThat(count(statement,
					"SELECT COUNT(*) FROM administrative_region WHERE adcode = '710000' AND level = 'province'"))
				.isEqualTo(1);
		}
	}

	private static int count(Statement statement, String query) throws Exception {
		try (ResultSet result = statement.executeQuery(query)) {
			assertThat(result.next()).isTrue();
			return result.getInt(1);
		}
	}

}
