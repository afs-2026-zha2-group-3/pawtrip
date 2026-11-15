package com.pawtrip.server.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AuthApiTest {

	private static final Path DB_PATH = Path.of("target", "auth-api-test.db");

	private static final String INVALID_CREDENTIALS_DETAIL = "Invalid username or password";

	@DynamicPropertySource
	static void datasourceProperties(DynamicPropertyRegistry registry) {
		try {
			Files.deleteIfExists(DB_PATH);
		}
		catch (IOException ex) {
			throw new UncheckedIOException("Failed to reset test database", ex);
		}
		registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DB_PATH + "?foreign_keys=on");
	}

	@Autowired
	MockMvc mockMvc;

	@Autowired
	AppUserRepository appUserRepository;

	@Autowired
	PasswordEncoder passwordEncoder;

	private String username;

	private String password;

	private String adminUsername;

	private String adminPassword;

	@BeforeEach
	void createUser() {
		this.username = "auth-user-" + UUID.randomUUID();
		this.password = UUID.randomUUID().toString();
		this.appUserRepository
			.save(new AppUser(this.username, this.passwordEncoder.encode(this.password), true));
		this.adminUsername = "auth-admin-" + UUID.randomUUID();
		this.adminPassword = UUID.randomUUID().toString();
		this.appUserRepository.save(new AppUser(this.adminUsername,
				this.passwordEncoder.encode(this.adminPassword), true, UserRole.ADMIN));
	}

	@Test
	void loginCreatesSessionAndAllowsGreeting() throws Exception {
		MvcResult result = login();
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);

		assertThat(session).isNotNull();
		mockMvc.perform(get("/api/greeting").session(session))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.message").value("Hello World"));
	}

	@Test
	void loginWithInvalidPasswordReturnsInvalidCredentials() throws Exception {
		MvcResult result = mockMvc
			.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.param("username", this.username)
				.param("password", "wrong-password"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(401))
			.andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
			.andExpect(jsonPath("$.detail").value(INVALID_CREDENTIALS_DETAIL))
			.andExpect(jsonPath("$.instance").value("/api/auth/login"))
			.andReturn();

		assertThat(result.getRequest().getSession(false)).isNull();
	}

	@Test
	void loginWithUnknownUsernameReturnsSameProblem() throws Exception {
		mockMvc
			.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.param("username", "missing-" + UUID.randomUUID())
				.param("password", this.password))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
			.andExpect(jsonPath("$.detail").value(INVALID_CREDENTIALS_DETAIL));
	}

	@Test
	void meReturnsCurrentUserWithSession() throws Exception {
		MvcResult result = login();
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);

		mockMvc.perform(get("/api/auth/me").session(session))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.username").value(this.username))
			.andExpect(jsonPath("$.role").value("USER"))
			.andExpect(jsonPath("$.passwordHash").doesNotExist());
	}

	@Test
	void meReturnsUnauthenticatedProblemWithoutSession() throws Exception {
		mockMvc.perform(get("/api/auth/me"))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
			.andExpect(jsonPath("$.instance").value("/api/auth/me"));
	}

	@Test
	void unauthenticatedGreetingReturnsProblemDetailsEvenForHtmlClients() throws Exception {
		mockMvc.perform(get("/api/greeting").accept(MediaType.TEXT_HTML))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
			.andExpect(header().doesNotExist(HttpHeaders.LOCATION));
	}

	@Test
	void logoutInvalidatesSession() throws Exception {
		MvcResult result = login();
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);

		mockMvc.perform(post("/api/auth/logout").with(csrf()).session(session))
			.andExpect(status().isNoContent());

		assertThat(session.isInvalid()).isTrue();
		mockMvc.perform(get("/api/greeting"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
	}

	@Test
	void logoutRequiresCsrf() throws Exception {
		MvcResult result = login();
		MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);

		mockMvc.perform(post("/api/auth/logout").session(session))
			.andExpect(status().isForbidden())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.code").value("ACCESS_DENIED"));

		assertThat(session.isInvalid()).isFalse();
		mockMvc.perform(get("/api/greeting").session(session))
			.andExpect(status().isOk());
	}

	@Test
	void adminApiRequiresAdminRole() throws Exception {
		mockMvc.perform(get("/api/admin/regions"))
			.andExpect(status().isUnauthorized())
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));

		MvcResult userLogin = login();
		MockHttpSession userSession = (MockHttpSession) userLogin.getRequest().getSession(false);
		mockMvc.perform(get("/api/admin/regions").session(userSession))
			.andExpect(status().isForbidden())
			.andExpect(jsonPath("$.code").value("ACCESS_DENIED"));

		MvcResult adminLogin = mockMvc.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.param("username", this.adminUsername)
				.param("password", this.adminPassword))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.username").value(this.adminUsername))
			.andExpect(jsonPath("$.role").value("ADMIN"))
			.andExpect(jsonPath("$.passwordHash").doesNotExist())
			.andReturn();
		MockHttpSession adminSession = (MockHttpSession) adminLogin.getRequest().getSession(false);
		mockMvc.perform(get("/api/admin/regions").session(adminSession))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$[0].adcode").exists());
	}

	private MvcResult login() throws Exception {
		return mockMvc
			.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.param("username", this.username)
				.param("password", this.password))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.username").value(this.username))
			.andExpect(jsonPath("$.role").value("USER"))
			.andExpect(jsonPath("$.passwordHash").doesNotExist())
			.andReturn();
	}

}
