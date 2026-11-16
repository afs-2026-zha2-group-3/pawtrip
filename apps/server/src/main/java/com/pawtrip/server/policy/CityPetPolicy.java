package com.pawtrip.server.policy;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "city_pet_policy")
public class CityPetPolicy {

	@Id
	@Column(name = "adcode", nullable = false)
	private String adcode;

	@Column(name = "area_scope")
	private String areaScope;

	@Column(name = "policies_json", nullable = false)
	private String policiesJson;

	@Column(name = "banned_breeds", nullable = false)
	private String bannedBreeds;

	@Column(name = "source_title", nullable = false)
	private String sourceTitle;

	@Column(name = "source_note")
	private String sourceNote;

	@Column(name = "updated_month", nullable = false)
	private String updatedMonth;

	protected CityPetPolicy() {
	}

	public CityPetPolicy(String adcode, String areaScope, String policiesJson, String bannedBreeds,
			String sourceTitle, String sourceNote, String updatedMonth) {
		this.adcode = adcode;
		this.areaScope = areaScope;
		this.policiesJson = policiesJson;
		this.bannedBreeds = bannedBreeds;
		this.sourceTitle = sourceTitle;
		this.sourceNote = sourceNote;
		this.updatedMonth = updatedMonth;
	}

	public String getAdcode() {
		return this.adcode;
	}

	public String getAreaScope() {
		return this.areaScope;
	}

	public String getPoliciesJson() {
		return this.policiesJson;
	}

	public String getBannedBreeds() {
		return this.bannedBreeds;
	}

	public String getSourceTitle() {
		return this.sourceTitle;
	}

	public String getSourceNote() {
		return this.sourceNote;
	}

	public String getUpdatedMonth() {
		return this.updatedMonth;
	}

}
