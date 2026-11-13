package com.pawtrip.server.greeting;

import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class GreetingController {

	private final JdbcTemplate jdbcTemplate;

	GreetingController(JdbcTemplate jdbcTemplate) {
		this.jdbcTemplate = jdbcTemplate;
	}

	@GetMapping("/api/greeting")
	Map<String, String> greeting() {
		String message = this.jdbcTemplate.queryForObject("SELECT message FROM greeting LIMIT 1", String.class);
		return Map.of("message", message);
	}

}
