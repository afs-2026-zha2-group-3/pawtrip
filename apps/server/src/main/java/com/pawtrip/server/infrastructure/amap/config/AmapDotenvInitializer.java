package com.pawtrip.server.infrastructure.amap.config;

import com.pawtrip.server.ServerApplication;
import java.io.File;
import java.io.IOException;
import java.io.Reader;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.CodeSource;
import java.util.Optional;
import java.util.Properties;
import org.springframework.boot.system.ApplicationHome;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MutablePropertySources;
import org.springframework.core.env.PropertiesPropertySource;
import org.springframework.core.env.StandardEnvironment;

public final class AmapDotenvInitializer
		implements ApplicationContextInitializer<ConfigurableApplicationContext> {

	private static final String ENV_FILE_PROPERTY = "PAWTRIP_ENV_FILE";
	private static final String API_KEY_PROPERTY = "AMAP_API_KEY";
	private static final String PROPERTY_SOURCE_NAME = "amapDotenv";

	private final Path applicationLocation;

	public AmapDotenvInitializer() {
		this(applicationLocation());
	}

	AmapDotenvInitializer(Path applicationLocation) {
		this.applicationLocation = applicationLocation;
	}

	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
		ConfigurableEnvironment environment = applicationContext.getEnvironment();
		resolveEnvironmentFile(environment)
				.filter(Files::isRegularFile)
				.ifPresent(path -> addApiKey(environment, path));
	}

	private Optional<Path> resolveEnvironmentFile(ConfigurableEnvironment environment) {
		String configuredPath = environment.getProperty(ENV_FILE_PROPERTY);
		if (configuredPath != null && !configuredPath.isBlank()) {
			Path path = Path.of(configuredPath);
			if (!path.isAbsolute()) {
				throw new IllegalStateException(ENV_FILE_PROPERTY + " must be an absolute path");
			}
			return Optional.of(path.normalize());
		}

		return findRepositoryRoot(applicationLocation).map(root -> root.resolve(".env"));
	}

	static Optional<Path> findRepositoryRoot(Path applicationLocation) {
		if (applicationLocation == null) {
			return Optional.empty();
		}

		Path current = Files.isDirectory(applicationLocation)
				? applicationLocation
				: applicationLocation.getParent();
		while (current != null) {
			if (Files.isRegularFile(current.resolve("package.json"))
					&& Files.isRegularFile(current.resolve("apps/server/pom.xml"))) {
				return Optional.of(current);
			}
			current = current.getParent();
		}
		return Optional.empty();
	}

	private static Path applicationLocation() {
		try {
			File source = new ApplicationHome(ServerApplication.class).getSource();
			if (source != null) {
				return source.toPath();
			}
		} catch (RuntimeException ignored) {
			// Fall back to the class location when Spring Boot cannot determine an application source.
		}

		try {
			CodeSource codeSource = ServerApplication.class.getProtectionDomain().getCodeSource();
			if (codeSource != null) {
				return Path.of(codeSource.getLocation().toURI());
			}
		} catch (RuntimeException | URISyntaxException ignored) {
			// Some launchers expose a nested URL that is not a filesystem path.
		}

		URL classResource = ServerApplication.class.getResource("ServerApplication.class");
		if (classResource != null && "file".equals(classResource.getProtocol())) {
			try {
				return Path.of(classResource.toURI());
			} catch (RuntimeException | URISyntaxException ignored) {
				// No filesystem-backed class location is available.
			}
		}
		return null;
	}

	private static void addApiKey(ConfigurableEnvironment environment, Path envFile) {
		Properties fileProperties = new Properties();
		try (Reader reader = Files.newBufferedReader(envFile, StandardCharsets.UTF_8)) {
			fileProperties.load(reader);
		} catch (IOException exception) {
			throw new IllegalStateException("Unable to read AMAP_API_KEY from environment file", exception);
		}

		String apiKey = fileProperties.getProperty(API_KEY_PROPERTY);
		if (apiKey == null) {
			return;
		}

		Properties amapProperties = new Properties();
		amapProperties.setProperty(API_KEY_PROPERTY, apiKey.strip());
		MutablePropertySources propertySources = environment.getPropertySources();
		propertySources.remove(PROPERTY_SOURCE_NAME);
		PropertiesPropertySource dotenvSource =
				new PropertiesPropertySource(PROPERTY_SOURCE_NAME, amapProperties);
		if (propertySources.contains(StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME)) {
			propertySources.addAfter(
					StandardEnvironment.SYSTEM_ENVIRONMENT_PROPERTY_SOURCE_NAME, dotenvSource);
		} else {
			propertySources.addLast(dotenvSource);
		}
	}
}
