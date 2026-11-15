package com.pawtrip.server.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.UUID;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class AppUserRoleMigrationTest {

	@Test
	void upgradesExistingV2AccountsWithoutSeedingUsers(@TempDir Path tempDir) throws SQLException, IOException {
		Path databasePath = tempDir.resolve("existing-v2.db");
		String jdbcUrl = "jdbc:sqlite:" + databasePath + "?foreign_keys=on";

		Flyway.configure()
			.dataSource(jdbcUrl, null, null)
			.target(MigrationVersion.fromVersion("2"))
			.load()
			.migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl);
				PreparedStatement insert = connection.prepareStatement(
						"INSERT INTO app_user (username, password_hash, enabled) VALUES (?, ?, ?)")) {
			insert.setString(1, "existing-user");
			insert.setString(2, "existing-hash");
			insert.setInt(3, 1);
			insert.executeUpdate();
		}

		Flyway.configure().dataSource(jdbcUrl, null, null).load().migrate();

		try (Connection connection = DriverManager.getConnection(jdbcUrl);
				PreparedStatement query = connection.prepareStatement(
						"SELECT username, role FROM app_user ORDER BY id");
				ResultSet results = query.executeQuery()) {
			assertThat(results.next()).isTrue();
			assertThat(results.getString("username")).isEqualTo("existing-user");
			assertThat(results.getString("role")).isEqualTo("USER");
			assertThat(results.next()).isFalse();
		}
	}

}
