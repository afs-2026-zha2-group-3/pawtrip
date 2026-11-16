package com.pawtrip.server.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "administrative_region")
public class AdministrativeRegion {

	@Id
	@Column(name = "adcode", nullable = false)
	private String adcode;

	@Column(nullable = false)
	private String name;

	@Column(name = "citycode")
	private String cityCode;

	@Column(nullable = false)
	private String level;

	@Column(name = "parent_adcode")
	private String parentAdcode;

	@Column(name = "max_pets_per_person")
	private Integer maxPetsPerPerson;

	@Column(name = "max_single_pet_weight_kg")
	private Double maxSinglePetWeightKg;

	@Column(name = "leash_required")
	private Boolean leashRequired;

	@Column(name = "vaccination_proof_required")
	private Boolean vaccinationProofRequired;

	@Column(name = "extra_fee_cents")
	private Long extraFeeCents;

	@Column(name = "reservation_required")
	private Boolean reservationRequired;

	protected AdministrativeRegion() {
	}

	public AdministrativeRegion(String adcode, String name, String cityCode, String level, String parentAdcode) {
		this.adcode = adcode;
		this.name = name;
		this.cityCode = cityCode;
		this.level = level;
		this.parentAdcode = parentAdcode;
	}

	public String getAdcode() {
		return this.adcode;
	}

	public String getName() {
		return this.name;
	}

	public String getCityCode() {
		return this.cityCode;
	}

	public String getLevel() {
		return this.level;
	}

	public String getParentAdcode() {
		return this.parentAdcode;
	}

	public Integer getMaxPetsPerPerson() {
		return this.maxPetsPerPerson;
	}

	public Double getMaxSinglePetWeightKg() {
		return this.maxSinglePetWeightKg;
	}

	public Boolean getLeashRequired() {
		return this.leashRequired;
	}

	public Boolean getVaccinationProofRequired() {
		return this.vaccinationProofRequired;
	}

	public Long getExtraFeeCents() {
		return this.extraFeeCents;
	}

	public Boolean getReservationRequired() {
		return this.reservationRequired;
	}

	public void updatePetPolicies(Integer maxPetsPerPerson, Double maxSinglePetWeightKg, Boolean leashRequired,
			Boolean vaccinationProofRequired, Long extraFeeCents, Boolean reservationRequired) {
		this.maxPetsPerPerson = maxPetsPerPerson;
		this.maxSinglePetWeightKg = maxSinglePetWeightKg;
		this.leashRequired = leashRequired;
		this.vaccinationProofRequired = vaccinationProofRequired;
		this.extraFeeCents = extraFeeCents;
		this.reservationRequired = reservationRequired;
	}

}
