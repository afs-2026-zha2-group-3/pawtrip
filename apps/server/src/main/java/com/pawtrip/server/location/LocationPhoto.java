package com.pawtrip.server.location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;

import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "location_photo")
public class LocationPhoto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "location_id", nullable = false)
	private Long locationId;

	@Column(name = "photo_order", nullable = false)
	private Integer photoOrder;

	@Column(name = "source_json", nullable = false)
	private String sourceJson;

	private String title;

	@Column(name = "source_url", nullable = false)
	private String sourceUrl;


	protected LocationPhoto() {
	}

	public LocationPhoto(Long locationId, Integer photoOrder, String sourceJson, String title, String sourceUrl) {
		this.locationId = locationId;
		this.photoOrder = photoOrder;
		this.sourceJson = sourceJson;
		this.title = title;
		this.sourceUrl = sourceUrl;
	}

	public Long getId() {
		return this.id;
	}

	public Long getLocationId() {
		return this.locationId;
	}

	public Integer getPhotoOrder() {
		return this.photoOrder;
	}

	public String getSourceJson() {
		return this.sourceJson;
	}

	public String getTitle() {
		return this.title;
	}

	public String getSourceUrl() {
		return this.sourceUrl;
	}


}
