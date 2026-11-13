package com.pawtrip.server.auth;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.CookieManager;
import java.net.HttpCookie;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class SecuritySessionTest {

	private static final Path DB_PATH = Path.of("target", "security-session-test.db");

	@DynamicPropertySource
	static void datasourceProperties(DynamicPropertyRegistry registry) {
		try {
			Files.deleteIfExists(DB_PATH);
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Failed to reset test database", ex);
		}
		registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DB_PATH);
	}

	@Value("${local.server.port}")
	int port;

	@Autowired
	AppUserRepository appUserRepository;

	@Autowired
	PasswordEncoder passwordEncoder;

	private String username;

	private String password;

	@BeforeEach
	void createUser() {
		this.username = "session-user-" + UUID.randomUUID();
		this.password = UUID.randomUUID().toString();
		this.appUserRepository
			.save(new AppUser(this.username, this.passwordEncoder.encode(this.password), true));
	}

	@Test
	void issuesSpaCsrfCookieAndProtectsSessionCookie() throws Exception {
		CookieManager cookies = new CookieManager();
		HttpClient client = HttpClient.newBuilder().cookieHandler(cookies).build();

		HttpResponse<String> probe = client.send(get("/api/auth/me"), HttpResponse.BodyHandlers.ofString());
		assertThat(probe.statusCode()).isEqualTo(401);

		HttpCookie csrfCookie = findCookie(cookies, "XSRF-TOKEN");
		assertThat(csrfCookie).isNotNull();
		assertThat(csrfCookie.getValue()).isNotBlank();
		assertThat(setCookie(probe, "XSRF-TOKEN")).doesNotContainIgnoringCase("HttpOnly");

		HttpResponse<String> login = client.send(formLogin(csrfCookie.getValue(), ""),
				HttpResponse.BodyHandlers.ofString());
		assertThat(login.statusCode()).isEqualTo(200);

		String sessionCookie = setCookie(login, "JSESSIONID");
		assertThat(sessionCookie).isNotBlank();
		assertThat(sessionCookie).containsIgnoringCase("HttpOnly");
		assertThat(sessionCookie).containsIgnoringCase("SameSite=Lax");

		assertThat(setCookie(login, "XSRF-TOKEN")).isNotBlank();
	}

	@Test
	void changesSessionIdAndInvalidatesOldSessionOnLogout() throws Exception {
		HttpClient anonymous = HttpClient.newHttpClient();
		HttpResponse<String> probe = anonymous.send(get("/api/auth/me"), HttpResponse.BodyHandlers.ofString());
		assertThat(probe.statusCode()).isEqualTo(401);
		String csrfToken = cookieValue(setCookie(probe, "XSRF-TOKEN"));
		assertThat(csrfToken).isNotBlank();

		HttpClient noCookies = HttpClient.newHttpClient();
		HttpResponse<String> login = noCookies.send(formLogin(csrfToken, "JSESSIONID=attacker-controlled"),
				HttpResponse.BodyHandlers.ofString());
		assertThat(login.statusCode()).isEqualTo(200);

		String sessionId = cookieValue(setCookie(login, "JSESSIONID"));
		assertThat(sessionId).isNotBlank();
		assertThat(sessionId).isNotEqualTo("attacker-controlled");

		String rotatedCsrf = cookieValue(setCookie(login, "XSRF-TOKEN"));
		assertThat(rotatedCsrf).isNotBlank();

		HttpResponse<String> logout = noCookies.send(logout(sessionId, rotatedCsrf),
				HttpResponse.BodyHandlers.ofString());
		assertThat(logout.statusCode()).isEqualTo(204);

		HttpResponse<String> afterLogout = noCookies.send(getWithSession("/api/greeting", sessionId),
				HttpResponse.BodyHandlers.ofString());
		assertThat(afterLogout.statusCode()).isEqualTo(401);
	}

	private HttpRequest get(String path) {
		return HttpRequest.newBuilder(uri(path)).header("Accept", "application/json").GET().build();
	}

	private HttpRequest getWithSession(String path, String sessionId) {
		return HttpRequest.newBuilder(uri(path))
			.header("Accept", "application/json")
			.header("Cookie", "JSESSIONID=" + sessionId)
			.GET()
			.build();
	}

	private HttpRequest formLogin(String csrfToken, String extraCookie) {
		String body = "username=" + encode(this.username) + "&password=" + encode(this.password);
		HttpRequest.Builder builder = HttpRequest.newBuilder(uri("/api/auth/login"))
			.header("Accept", "application/json")
			.header("Content-Type", "application/x-www-form-urlencoded")
			.header("X-XSRF-TOKEN", csrfToken)
			.POST(HttpRequest.BodyPublishers.ofString(body));
		if (extraCookie != null && !extraCookie.isBlank()) {
			builder.header("Cookie", "XSRF-TOKEN=" + csrfToken + "; " + extraCookie);
		}
		return builder.build();
	}

	private HttpRequest logout(String sessionId, String csrfToken) {
		return HttpRequest.newBuilder(uri("/api/auth/logout"))
			.header("Accept", "application/json")
			.header("Cookie", "JSESSIONID=" + sessionId + "; XSRF-TOKEN=" + csrfToken)
			.header("X-XSRF-TOKEN", csrfToken)
			.POST(HttpRequest.BodyPublishers.noBody())
			.build();
	}

	private URI uri(String path) {
		return URI.create("http://localhost:" + this.port + path);
	}

	private static String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}

	private static HttpCookie findCookie(CookieManager manager, String name) {
		return manager.getCookieStore()
			.getCookies()
			.stream()
			.filter(cookie -> cookie.getName().equals(name))
			.findFirst()
			.orElse(null);
	}

	private static String setCookie(HttpResponse<?> response, String name) {
		return response.headers()
			.allValues("set-cookie")
			.stream()
			.filter(value -> value.startsWith(name + "="))
			.reduce((first, second) -> second)
			.orElse("");
	}

	private static String cookieValue(String setCookieHeader) {
		if (setCookieHeader.isBlank()) {
			return "";
		}
		int start = setCookieHeader.indexOf('=') + 1;
		int end = setCookieHeader.indexOf(';', start);
		return end < 0 ? setCookieHeader.substring(start) : setCookieHeader.substring(start, end);
	}

}
