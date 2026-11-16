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

	@Column(name = "name", nullable = false)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "pet_type", nullable = false)
	private PetType petType;

	@Column(name = "weight_kg", nullable = false)
	private Double weightKg;

	@Column(name = "shoulder_height_cm", nullable = false)
	private Double shoulderHeightCm;

	@Column(name = "has_leash", nullable = false)
	private boolean hasLeash;

	@Column(name = "has_vaccination_proof", nullable = false)
	private boolean hasVaccinationProof;

	@Column(name = "photo")
	private byte[] photo;

	protected Pet() {
	}

	public Pet(Long userId, String name, PetType petType, Double weightKg, Double shoulderHeightCm,
			boolean hasLeash, boolean hasVaccinationProof, byte[] photo) {
		this.userId = userId;
		this.name = name;
		this.petType = petType;
		this.weightKg = weightKg;
		this.shoulderHeightCm = shoulderHeightCm;
		this.hasLeash = hasLeash;
		this.hasVaccinationProof = hasVaccinationProof;
		this.photo = photo;
	}

	public void update(String name, PetType petType, Double weightKg, Double shoulderHeightCm, boolean hasLeash,
			boolean hasVaccinationProof, byte[] photo) {
		this.name = name;
		this.petType = petType;
		this.weightKg = weightKg;
		this.shoulderHeightCm = shoulderHeightCm;
		this.hasLeash = hasLeash;
		this.hasVaccinationProof = hasVaccinationProof;
		this.photo = photo;
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

	public PetType getPetType() {
		return this.petType;
	}

	public Double getWeightKg() {
		return this.weightKg;
	}

	public Double getShoulderHeightCm() {
		return this.shoulderHeightCm;
	}

	public boolean hasLeash() {
		return this.hasLeash;
	}

	public boolean hasVaccinationProof() {
		return this.hasVaccinationProof;
	}

	public byte[] getPhoto() {
		return this.photo == null ? null : this.photo.clone();
	}

}
