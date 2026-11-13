package com.pawtrip.server.auth;

import java.io.IOException;

import com.pawtrip.server.error.ApiErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

@Component
public class JsonAuthenticationFailureHandler implements AuthenticationFailureHandler {

	private static final Logger log = LoggerFactory.getLogger(JsonAuthenticationFailureHandler.class);

	private final SecurityProblemWriter problemWriter;

	public JsonAuthenticationFailureHandler(SecurityProblemWriter problemWriter) {
		this.problemWriter = problemWriter;
	}

	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException exception) throws IOException {
		log.info("Authentication failed for {}", request.getRequestURI());
		this.problemWriter.write(request, response, ApiErrorCode.INVALID_CREDENTIALS,
				"Invalid username or password");
	}

}
