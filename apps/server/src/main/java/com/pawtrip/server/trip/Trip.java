package com.pawtrip.server.trip;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip")
public class Trip {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "name", nullable = false)
	private String name;

	@Column(name = "city_adcode", nullable = false)
	private String cityAdcode;

	@Column(name = "pet_id", nullable = false)
	private Long petId;

	@Column(name = "total_days", nullable = false)
	private int totalDays;

	@Column(name = "transport_mode")
	private String transportMode;

	@Column(name = "plan_json", nullable = false)
	private String planJson;

	@Column(name = "created_at", nullable = false)
	private String createdAt;

	@Column(name = "updated_at", nullable = false)
	private String updatedAt;

	protected Trip() {
	}

	public Trip(Long userId, String name, String cityAdcode, Long petId, int totalDays, String transportMode,
			String planJson) {
		this.userId = userId;
		this.name = name;
		this.cityAdcode = cityAdcode;
		this.petId = petId;
		this.totalDays = totalDays;
		this.transportMode = transportMode;
		this.planJson = planJson;
		String now = Instant.now().toString();
		this.createdAt = now;
		this.updatedAt = now;
	}

	public void update(String name, int totalDays, String planJson, String transportMode) {
		this.name = name;
		this.totalDays = totalDays;
		this.planJson = planJson;
		this.transportMode = transportMode;
		this.updatedAt = Instant.now().toString();
	}

	public Long getId() {
		return this.id;
	}

	public Long getUserId() {
		return this.userId;
	}

	public String getName() {
		return this.name;
	}

	public String getCityAdcode() {
		return this.cityAdcode;
	}

	public Long getPetId() {
		return this.petId;
	}

	public int getTotalDays() {
		return this.totalDays;
	}

	public String getPlanJson() {
		return this.planJson;
	}

	public String getTransportMode() {
		return this.transportMode;
	}

	public String getCreatedAt() {
		return this.createdAt;
	}

	public String getUpdatedAt() {
		return this.updatedAt;
	}

}
