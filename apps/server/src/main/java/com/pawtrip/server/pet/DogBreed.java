package com.pawtrip.server.pet;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "dog_breed")
public class DogBreed {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true)
	private String name;

	@Column(name = "official_aggressive", nullable = false)
	private boolean officialAggressive;

	protected DogBreed() {
	}

	public DogBreed(String name, boolean officialAggressive) {
		this.name = name;
		this.officialAggressive = officialAggressive;
	}

	public Long getId() {
		return this.id;
	}

	public String getName() {
		return this.name;
	}

	public boolean isOfficialAggressive() {
		return this.officialAggressive;
	}

}
