package com.pawtrip.server.pet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pet")
public class Pet {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(name = "pet_type", nullable = false)
	private PetType petType;

	@Column(name = "weight_kg", nullable = false)
	private Double weightKg;

	@Column(name = "has_leash", nullable = false)
	private boolean hasLeash;

	@Column(name = "has_vaccination_proof", nullable = false)
	private boolean hasVaccinationProof;

	protected Pet() {
	}

	public Pet(Long userId, PetType petType, Double weightKg, boolean hasLeash, boolean hasVaccinationProof) {
		this.userId = userId;
		this.petType = petType;
		this.weightKg = weightKg;
		this.hasLeash = hasLeash;
		this.hasVaccinationProof = hasVaccinationProof;
	}

	public Long getId() {
		return this.id;
	}

	public Long getUserId() {
		return this.userId;
	}

	public PetType getPetType() {
		return this.petType;
	}

	public Double getWeightKg() {
		return this.weightKg;
	}

	public boolean hasLeash() {
		return this.hasLeash;
	}

	public boolean hasVaccinationProof() {
		return this.hasVaccinationProof;
	}

}
