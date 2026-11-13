package com.pawtrip.server.auth;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

	protected AppUser() {
	}

	public AppUser(String username, String passwordHash, boolean enabled) {
		this.username = username;
		this.passwordHash = passwordHash;
		this.enabled = enabled;
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

}
