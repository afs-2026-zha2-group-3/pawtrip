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

}
