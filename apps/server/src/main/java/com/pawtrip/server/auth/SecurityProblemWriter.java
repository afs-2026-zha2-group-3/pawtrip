package com.pawtrip.server.auth;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

import com.pawtrip.server.error.ApiErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class SecurityProblemWriter {

	private final ObjectMapper objectMapper;

	public SecurityProblemWriter(ObjectMapper objectMapper) {
		this.objectMapper = objectMapper;
	}

	public void write(HttpServletRequest request, HttpServletResponse response, ApiErrorCode code, String detail)
			throws IOException {
		response.setStatus(code.getStatus().value());
		response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());

		Map<String, Object> problem = new LinkedHashMap<>();
		problem.put("type", code.getType());
		problem.put("title", code.getTitle());
		problem.put("status", code.getStatus().value());
		problem.put("detail", detail);
		problem.put("instance", request.getRequestURI());
		problem.put("code", code.name());

		this.objectMapper.writeValue(response.getOutputStream(), problem);
	}

}
