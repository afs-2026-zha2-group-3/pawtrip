package com.pawtrip.server.destination;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "region_banned_breed")
public class RegionBannedBreed {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "region_adcode", nullable = false)
	private String regionAdcode;

	@Column(name = "breed_name", nullable = false)
	private String breedName;

	@Column(nullable = false)
	private String source;

	@Column(nullable = false)
	private String updated;

	protected RegionBannedBreed() {
	}

	public RegionBannedBreed(String regionAdcode, String breedName, String source, String updated) {
		this.regionAdcode = regionAdcode;
		this.breedName = breedName;
		this.source = source;
		this.updated = updated;
	}

	public Long getId() {
		return this.id;
	}

	public String getRegionAdcode() {
		return this.regionAdcode;
	}

	public String getBreedName() {
		return this.breedName;
	}

	public String getSource() {
		return this.source;
	}

	public String getUpdated() {
		return this.updated;
	}

}