package com.pawtrip.server.location;

import java.util.ArrayList;
import java.util.List;

import com.pawtrip.server.pet.DogBreed;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.OrderBy;
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

	@Column(name = "max_single_pet_shoulder_height_cm")
	private Double maxSinglePetShoulderHeightCm;

	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(name = "city_allowed_dog_breed",
			joinColumns = @JoinColumn(name = "adcode"),
			inverseJoinColumns = @JoinColumn(name = "dog_breed_id"))
	@OrderBy("id ASC")
	private List<DogBreed> allowedDogBreeds = new ArrayList<>();

	@Column(name = "leash_required")
	private Boolean leashRequired;

	@Column(name = "vaccination_proof_required")
	private Boolean vaccinationProofRequired;

	@Column(name = "extra_fee_cents")
	private Long extraFeeCents;

	@Column(name = "reservation_required")
	private Boolean reservationRequired;

	@Column(name = "allowed_pet_types")
	private String allowedPetTypes;

	// REQ-014 城市特征标签（V27 种子维护）：只读下发，管理端写路径不触碰
	@Column(name = "feature_tags")
	private String featureTags;

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

	public Double getMaxSinglePetShoulderHeightCm() {
		return this.maxSinglePetShoulderHeightCm;
	}

	public List<DogBreed> getAllowedDogBreeds() {
		return List.copyOf(this.allowedDogBreeds);
	}

	public void updateAllowedDogBreeds(List<DogBreed> allowedDogBreeds) {
		this.allowedDogBreeds.clear();
		this.allowedDogBreeds.addAll(allowedDogBreeds);
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

	public String getAllowedPetTypes() {
		return this.allowedPetTypes;
	}

	public String getFeatureTags() {
		return this.featureTags;
	}

	public void updatePetPolicies(String allowedPetTypes, Integer maxPetsPerPerson, Double maxSinglePetWeightKg,
			Double maxSinglePetShoulderHeightCm, Boolean leashRequired, Boolean vaccinationProofRequired,
			Long extraFeeCents, Boolean reservationRequired) {
		this.allowedPetTypes = allowedPetTypes;
		this.maxPetsPerPerson = maxPetsPerPerson;
		this.maxSinglePetWeightKg = maxSinglePetWeightKg;
		this.maxSinglePetShoulderHeightCm = maxSinglePetShoulderHeightCm;
		this.leashRequired = leashRequired;
		this.vaccinationProofRequired = vaccinationProofRequired;
		this.extraFeeCents = extraFeeCents;
		this.reservationRequired = reservationRequired;
	}

}
