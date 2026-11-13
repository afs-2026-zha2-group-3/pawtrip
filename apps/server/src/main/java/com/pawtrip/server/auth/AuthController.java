package com.pawtrip.server.auth;

import com.pawtrip.server.error.UnauthenticatedException;

import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AuthController {

	@GetMapping("/api/auth/me")
	CurrentUserResponse me(Authentication authentication) {
		if (authentication == null || !authentication.isAuthenticated()
				|| authentication instanceof AnonymousAuthenticationToken) {
			throw new UnauthenticatedException();
		}
		return new CurrentUserResponse(authentication.getName());
	}

	record CurrentUserResponse(String username) {
	}

}
