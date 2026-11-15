package com.pawtrip.server.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "app_user")
public class AppUser {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String username;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(nullable = false)
	private boolean enabled;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private UserRole role;

	protected AppUser() {
	}

	public AppUser(String username, String passwordHash, boolean enabled) {
		this(username, passwordHash, enabled, UserRole.USER);
	}

	public AppUser(String username, String passwordHash, boolean enabled, UserRole role) {
		this.username = username;
		this.passwordHash = passwordHash;
		this.enabled = enabled;
		this.role = role;
	}

	public Long getId() {
		return this.id;
	}

	public String getUsername() {
		return this.username;
	}

	public String getPasswordHash() {
		return this.passwordHash;
	}

	public boolean isEnabled() {
		return this.enabled;
	}

	public UserRole getRole() {
		return this.role;
	}

}
