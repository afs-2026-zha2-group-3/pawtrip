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
		return CurrentUserResponse.from(authentication);
	}

}

record CurrentUserResponse(String username, String role) {

	static CurrentUserResponse from(Authentication authentication) {
		String role = authentication.getAuthorities()
			.stream()
			.map(authority -> authority.getAuthority())
			.filter(authority -> authority.startsWith("ROLE_"))
			.map(authority -> authority.substring("ROLE_".length()))
			.findFirst()
			.orElseThrow(() -> new IllegalStateException("Authenticated user has no role"));
		return new CurrentUserResponse(authentication.getName(), role);
	}

}
