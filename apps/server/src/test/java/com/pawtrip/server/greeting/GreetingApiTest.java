package com.pawtrip.server.greeting;

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

import com.pawtrip.server.auth.AppUser;
import com.pawtrip.server.auth.AppUserRepository;
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
class GreetingApiTest {

	private static final Path DB_PATH = Path.of("target", "greeting-api-test.db");

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

	@Autowired
	MockMvc mockMvc;

	@Autowired
	AppUserRepository appUserRepository;

	@Autowired
	PasswordEncoder passwordEncoder;

	private String username;

	private String password;

	@BeforeEach
	void createAuthenticatedUser() {
		this.username = "greeting-user-" + UUID.randomUUID();
		this.password = UUID.randomUUID().toString();
		this.appUserRepository
			.save(new AppUser(this.username, this.passwordEncoder.encode(this.password), true));
	}

	@Test
	void returnsUnauthenticatedProblemWithoutSession() throws Exception {
		mockMvc.perform(get("/api/greeting").accept(MediaType.TEXT_HTML))
			.andExpect(status().isUnauthorized())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
			.andExpect(jsonPath("$.status").value(401))
			.andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
			.andExpect(jsonPath("$.instance").value("/api/greeting"))
			.andExpect(header().doesNotExist(HttpHeaders.LOCATION));
	}

	@Test
	void returnsSeededGreetingWithAuthenticatedSession() throws Exception {
		MockHttpSession session = login();
		assertThat(session).isNotNull();

		mockMvc.perform(get("/api/greeting").session(session))
			.andExpect(status().isOk())
			.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
			.andExpect(jsonPath("$.message").value("Hello World"))
			.andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
	}

	private MockHttpSession login() throws Exception {
		MvcResult result = mockMvc
			.perform(post("/api/auth/login").with(csrf())
				.contentType(MediaType.APPLICATION_FORM_URLENCODED)
				.param("username", this.username)
				.param("password", this.password))
			.andExpect(status().isOk())
			.andReturn();
		return (MockHttpSession) result.getRequest().getSession(false);
	}

}
