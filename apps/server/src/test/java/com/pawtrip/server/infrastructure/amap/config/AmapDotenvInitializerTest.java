package com.pawtrip.server.infrastructure.amap.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;

class AmapDotenvInitializerTest {

	@TempDir Path tempDir;

	private String originalUserDir;

	@AfterEach
	void restoreUserDir() {
		if (originalUserDir != null) {
			System.setProperty("user.dir", originalUserDir);
		}
	}

	@Test
	void loadsRepositoryRootEnvWithoutDependingOnCurrentWorkingDirectory() throws IOException {
		Path repository = createRepository("repository");
		Path envFile = repository.resolve(".env");
		Files.writeString(envFile, "AMAP_API_KEY=dotenv-key\n");
		Path applicationJar = repository.resolve("apps/server/target/pawtrip-server.jar");
		Files.writeString(applicationJar, "");
		Path unrelatedWorkingDirectory = Files.createDirectories(tempDir.resolve("elsewhere"));
		originalUserDir = System.getProperty("user.dir");
		System.setProperty("user.dir", unrelatedWorkingDirectory.toString());

		GenericApplicationContext context = contextWithSystemEnvironment(Map.of());
		new AmapDotenvInitializer(applicationJar).initialize(context);

		assertThat(context.getEnvironment().getProperty("AMAP_API_KEY"))
				.isEqualTo("dotenv-key");
	}

	@Test
	void processEnvironmentOverridesTheDotenvValue() throws IOException {
		Path repository = createRepository("override-repository");
		Files.writeString(repository.resolve(".env"), "AMAP_API_KEY=file-key\n");
		GenericApplicationContext context =
				contextWithSystemEnvironment(Map.of("AMAP_API_KEY", "process-key"));

		new AmapDotenvInitializer(repository.resolve("apps/server/target/classes"))
				.initialize(context);

		assertThat(context.getEnvironment().getProperty("AMAP_API_KEY"))
				.isEqualTo("process-key");
	}

	@Test
	void explicitAbsolutePathLoadsEnvOutsideTheRepository() throws IOException {
		Path repository = createRepository("deployed-repository");
		Path externalEnv = tempDir.resolve("external.env");
		Files.writeString(externalEnv, "AMAP_API_KEY=external-key\n");
		GenericApplicationContext context =
				contextWithSystemEnvironment(
						Map.of("PAWTRIP_ENV_FILE", externalEnv.toAbsolutePath().toString()));

		new AmapDotenvInitializer(repository.resolve("apps/server/target/classes"))
				.initialize(context);

		assertThat(context.getEnvironment().getProperty("AMAP_API_KEY"))
				.isEqualTo("external-key");
	}

	@Test
	void missingEnvFileDoesNotPreventInitialization() throws IOException {
		Path repository = createRepository("missing-env-repository");
		GenericApplicationContext context = contextWithSystemEnvironment(Map.of());

		assertThatCode(
					() ->
							new AmapDotenvInitializer(
									repository.resolve("apps/server/target/classes"))
								.initialize(context))
				.doesNotThrowAnyException();
		assertThat(context.getEnvironment().getProperty("AMAP_API_KEY")).isNull();
	}

	@Test
	@ExtendWith(OutputCaptureExtension.class)
	void doesNotLogTheApiKeyLoadedFromEnvFile(CapturedOutput output) throws IOException {
		Path repository = createRepository("no-key-logging-repository");
		Files.writeString(repository.resolve(".env"), "AMAP_API_KEY=secret-value\n");
		GenericApplicationContext context = contextWithSystemEnvironment(Map.of());

		new AmapDotenvInitializer(repository.resolve("apps/server/target/classes"))
				.initialize(context);

		assertThat(output.getAll()).doesNotContain("secret-value");
	}

	@Test
	void rejectsRelativeOverrideInsteadOfUsingTheWorkingDirectory() throws IOException {
		Path repository = createRepository("relative-env-repository");
		GenericApplicationContext context =
				contextWithSystemEnvironment(Map.of("PAWTRIP_ENV_FILE", ".env"));

		assertThatCode(
					() ->
							new AmapDotenvInitializer(
									repository.resolve("apps/server/target/classes"))
								.initialize(context))
			.isInstanceOf(IllegalStateException.class)
			.hasMessage("PAWTRIP_ENV_FILE must be an absolute path");
	}

	private Path createRepository(String name) throws IOException {
		Path repository = tempDir.resolve(name);
		Files.createDirectories(repository.resolve("apps/server/target/classes"));
		Files.writeString(repository.resolve("package.json"), "{}\n");
		Files.writeString(repository.resolve("apps/server/pom.xml"), "<project/>\n");
		return repository;
	}

	private GenericApplicationContext contextWithSystemEnvironment(Map<String, Object> values) {
		StandardEnvironment environment = new StandardEnvironment();
		environment
				.getPropertySources()
				.replace(
						StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME,
						new MapPropertySource(
								StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, values));
		GenericApplicationContext context = new GenericApplicationContext();
		context.setEnvironment(environment);
		return context;
	}
}
