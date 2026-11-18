package com.pawtrip.server.packing;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "trip_packing_checklist")
public class TripPackingChecklist {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "trip_id", nullable = false, unique = true)
	private Long tripId;

	@Column(name = "created_at", nullable = false)
	private String createdAt;

	@Column(name = "updated_at", nullable = false)
	private String updatedAt;

	protected TripPackingChecklist() {
	}

	public TripPackingChecklist(Long tripId) {
		this.tripId = tripId;
		String now = Instant.now().toString();
		this.createdAt = now;
		this.updatedAt = now;
	}

	public void touch() {
		this.updatedAt = Instant.now().toString();
	}

	public Long getId() {
		return this.id;
	}

	public Long getTripId() {
		return this.tripId;
	}

	public String getCreatedAt() {
		return this.createdAt;
	}

	public String getUpdatedAt() {
		return this.updatedAt;
	}

}
