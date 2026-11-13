package com.pawtrip.server.greeting;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(GreetingController.class)
class GreetingNotFoundApiTest {

	@Autowired
	MockMvc mockMvc;

	@MockitoBean
	GreetingRepository greetingRepository;

	@Test
	void returnsProblemDetailWhenNoGreetingExists() throws Exception {
		given(this.greetingRepository.findFirstByOrderByIdAsc()).willReturn(Optional.empty());

		mockMvc.perform(get("/api/greeting"))
				.andExpect(status().isNotFound())
				.andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
				.andExpect(jsonPath("$.status").value(404))
				.andExpect(jsonPath("$.code").value("GREETING_NOT_FOUND"))
				.andExpect(jsonPath("$.detail").value("No greeting configured"))
				.andExpect(jsonPath("$.instance").value("/api/greeting"));
	}

}
