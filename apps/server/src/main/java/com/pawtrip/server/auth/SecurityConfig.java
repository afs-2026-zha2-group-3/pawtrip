package com.pawtrip.server.auth;

import com.pawtrip.server.error.ApiErrorCode;
import jakarta.servlet.DispatcherType;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler;
import org.springframework.security.web.csrf.CsrfFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http, SecurityProblemWriter problemWriter,
			JsonAuthenticationSuccessHandler successHandler, JsonAuthenticationFailureHandler failureHandler)
			throws Exception {
		http
			.csrf(csrf -> csrf.spa())
			.authorizeHttpRequests(authorize -> authorize
				.dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
				.requestMatchers("/api/auth/login", "/api/auth/me", "/api/auth/logout", "/error").permitAll()
				.requestMatchers("/api/**").authenticated()
				.anyRequest().denyAll())
			.formLogin(form -> form
				.loginPage("/login")
				.loginProcessingUrl("/api/auth/login")
				.successHandler(successHandler)
				.failureHandler(failureHandler)
				.permitAll())
			.logout(logout -> logout
				.logoutUrl("/api/auth/logout")
				.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler(HttpStatus.NO_CONTENT)))
			.exceptionHandling(exceptionHandling -> exceptionHandling
				.authenticationEntryPoint((request, response, exception) -> problemWriter.write(request, response,
						ApiErrorCode.UNAUTHENTICATED, "Authentication required"))
				.accessDeniedHandler((request, response, exception) -> problemWriter.write(request, response,
						ApiErrorCode.ACCESS_DENIED, "Access denied")))
			.sessionManagement(session -> session
				.sessionFixation(fixation -> fixation.changeSessionId()))
			.requestCache(cache -> cache.disable())
			.httpBasic(AbstractHttpConfigurer::disable)
			.rememberMe(AbstractHttpConfigurer::disable)
			.addFilterAfter(new CsrfCookieFilter(), CsrfFilter.class);

		return http.build();
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
