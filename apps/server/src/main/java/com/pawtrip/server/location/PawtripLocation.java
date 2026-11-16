package com.pawtrip.server.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "pawtrip_location")
public class PawtripLocation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "poi_id", nullable = false, unique = true)
	private String poiId;

	@Column(nullable = false)
	private String name;

	@Column(name = "type_code", nullable = false)
	private String typeCode;

	@Column(name = "type_group", nullable = false)
	private String typeGroup;

	private String address;

	private Double longitude;

	private Double latitude;

	@Column(name = "region_code")
	private String regionCode;

	@Column(name = "poi_json", nullable = false)
	private String poiJson;

	@Column(name = "business_json", nullable = false)
	private String businessJson;

	@Column(name = "min_visit_hours")
	private Integer minVisitHours;

	@Column(name = "max_visit_hours")
	private Integer maxVisitHours;

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

	@Column(name = "allowed_pet_types")
	private String allowedPetTypes;

	protected PawtripLocation() {
	}

	public PawtripLocation(String poiId, String name, String typeCode, String typeGroup, String address,
			Double longitude, Double latitude, String regionCode, String poiJson, String businessJson,
			Integer minVisitHours, Integer maxVisitHours) {
		this.poiId = poiId;
		this.name = name;
		this.typeCode = typeCode;
		this.typeGroup = typeGroup;
		this.address = address;
		this.longitude = longitude;
		this.latitude = latitude;
		this.regionCode = regionCode;
		this.poiJson = poiJson;
		this.businessJson = businessJson;
		this.minVisitHours = minVisitHours;
		this.maxVisitHours = maxVisitHours;
	}

	public Long getId() {
		return this.id;
	}

	public String getPoiId() {
		return this.poiId;
	}

	public String getName() {
		return this.name;
	}

	public String getTypeCode() {
		return this.typeCode;
	}

	public String getTypeGroup() {
		return this.typeGroup;
	}

	public String getAddress() {
		return this.address;
	}

	public Double getLongitude() {
		return this.longitude;
	}

	public Double getLatitude() {
		return this.latitude;
	}

	public String getRegionCode() {
		return this.regionCode;
	}

	public String getPoiJson() {
		return this.poiJson;
	}

	public String getBusinessJson() {
		return this.businessJson;
	}

	public Integer getMinVisitHours() {
		return this.minVisitHours;
	}

	public Integer getMaxVisitHours() {
		return this.maxVisitHours;
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

	public String getAllowedPetTypes() {
		return this.allowedPetTypes;
	}

	public void updateVisitHours(Integer minVisitHours, Integer maxVisitHours) {
		this.minVisitHours = minVisitHours;
		this.maxVisitHours = maxVisitHours;
	}

	public void updatePetPolicies(String allowedPetTypes, Integer maxPetsPerPerson, Double maxSinglePetWeightKg,
			Boolean leashRequired, Boolean vaccinationProofRequired, Long extraFeeCents,
			Boolean reservationRequired) {
		this.allowedPetTypes = allowedPetTypes;
		this.maxPetsPerPerson = maxPetsPerPerson;
		this.maxSinglePetWeightKg = maxSinglePetWeightKg;
		this.leashRequired = leashRequired;
		this.vaccinationProofRequired = vaccinationProofRequired;
		this.extraFeeCents = extraFeeCents;
		this.reservationRequired = reservationRequired;
	}

}
