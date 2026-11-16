package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.util.List;

import com.pawtrip.server.pet.DogBreed;
import com.pawtrip.server.pet.DogBreedRepository;

import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
class LocationRepositoryTest {

	private static final Path DB_PATH = Path.of("target", "location-repository-test.db");

	@DynamicPropertySource
	static void datasourceProperties(DynamicPropertyRegistry registry) {
		try {
			Files.deleteIfExists(DB_PATH);
		}
		catch (IOException exception) {
			throw new UncheckedIOException("Failed to reset test database", exception);
		}
		registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + DB_PATH + "?foreign_keys=on");
	}

	@Autowired
	AdministrativeRegionRepository regionRepository;

	@Autowired
	PawtripLocationRepository locationRepository;

	@Autowired
	LocationPhotoRepository photoRepository;

	@Autowired
	DogBreedRepository dogBreedRepository;

	@Autowired
	EntityManager entityManager;

	@BeforeEach
	void clearRepositories() {
		this.photoRepository.deleteAll();
		this.locationRepository.deleteAll();
		this.regionRepository.deleteById("990003");
	}

	@AfterEach
	void removeTestRegion() {
		this.regionRepository.deleteById("990003");
	}

	@Test
	void repositoryExposesProvinceAndCityLevelsForTreeConstruction() {
		var province = this.regionRepository.findById("330000").orElseThrow();
		var city = this.regionRepository.findById("330100").orElseThrow();

		assertThat(province.getLevel()).isEqualTo("province");
		assertThat(province.getParentAdcode()).isNull();
		assertThat(city.getLevel()).isEqualTo("city");
		assertThat(city.getParentAdcode()).isEqualTo(province.getAdcode());
	}

	@Test
	void persistsIndependentPetPoliciesForRegionsAndLocations() {
		var region = new AdministrativeRegion("990003", "Test region", null, "province", null);
		var location = location("poi-pet-policy-jpa", "990003", "attraction");
		region.updatePetPolicies("CAT,DOG", 3, 18.5, 55.0, true, false, 1250L, null);
		location.updatePetPolicies("DOG", 1, 8.75, 40.0, false, true, 75L, false);

		this.regionRepository.saveAndFlush(region);
		this.locationRepository.saveAndFlush(location);
		this.entityManager.clear();

		var persistedRegion = this.regionRepository.findById("990003").orElseThrow();
		var persistedLocation = this.locationRepository.findByPoiId("poi-pet-policy-jpa").orElseThrow();
		assertThat(persistedRegion.getMaxPetsPerPerson()).isEqualTo(3);
		assertThat(persistedRegion.getMaxSinglePetWeightKg()).isEqualTo(18.5);
		assertThat(persistedRegion.getMaxSinglePetShoulderHeightCm()).isEqualTo(55.0);
		assertThat(persistedRegion.getLeashRequired()).isTrue();
		assertThat(persistedRegion.getVaccinationProofRequired()).isFalse();
		assertThat(persistedRegion.getExtraFeeCents()).isEqualTo(1250L);
		assertThat(persistedRegion.getReservationRequired()).isNull();
		assertThat(persistedRegion.getAllowedPetTypes()).isEqualTo("CAT,DOG");
		assertThat(persistedLocation.getMaxPetsPerPerson()).isEqualTo(1);
		assertThat(persistedLocation.getMaxSinglePetWeightKg()).isEqualTo(8.75);
		assertThat(persistedLocation.getMaxSinglePetShoulderHeightCm()).isEqualTo(40.0);
		assertThat(persistedLocation.getLeashRequired()).isFalse();
		assertThat(persistedLocation.getVaccinationProofRequired()).isTrue();
		assertThat(persistedLocation.getExtraFeeCents()).isEqualTo(75L);
		assertThat(persistedLocation.getReservationRequired()).isFalse();
		assertThat(persistedLocation.getAllowedPetTypes()).isEqualTo("DOG");
	}

	@Test
	@Transactional
	void persistsAllowedDogBreedsForCities() {
		var pastoralDog = this.dogBreedRepository.save(new DogBreed("测试田园犬", false));
		var tibetanMastiff = this.dogBreedRepository.save(new DogBreed("测试獒犬", true));
		var city = new AdministrativeRegion("990003", "Test city", null, "city", "330000");
		city.updateAllowedDogBreeds(List.of(pastoralDog, tibetanMastiff));

		this.regionRepository.saveAndFlush(city);
		this.entityManager.clear();

		var persistedCity = this.regionRepository.findById("990003").orElseThrow();
		assertThat(persistedCity.getAllowedDogBreeds()).extracting(DogBreed::getName)
			.containsExactly("测试田园犬", "测试獒犬");
		assertThat(persistedCity.getAllowedDogBreeds()).extracting(DogBreed::isOfficialAggressive)
			.containsExactly(false, true);
	}

	@Test
	void filtersLocationPagesByRegionAndTypeGroup() {
		this.locationRepository.saveAll(List.of(
				location("poi-hangzhou", "330106", "attraction"),
				location("poi-ningbo", "330205", "attraction"),
				location("poi-hefei", "340105", "attraction"),
				location("poi-hotel", "330106", "hotel")));
		this.locationRepository.flush();

		var cityPage = this.locationRepository.findAdminPage(
				"330100", "city", "attraction", PageRequest.of(0, 10));
		var provincePage = this.locationRepository.findAdminPage(
				"330000", "province", "attraction", PageRequest.of(0, 10));

		assertThat(cityPage.getContent()).extracting(PawtripLocation::getPoiId).containsExactly("poi-hangzhou");
		assertThat(provincePage.getContent()).extracting(PawtripLocation::getPoiId)
			.containsExactly("poi-hangzhou", "poi-ningbo");
	}

	@Test
	void enforcesUniquePoiIdsAndUsesDatabasePagingInIdOrder() {
		this.locationRepository.saveAndFlush(location("poi-1", null, "attraction"));
		assertThatThrownBy(() -> this.locationRepository.saveAndFlush(location("poi-1", null, "attraction")))
			.isInstanceOf(JpaSystemException.class)
							.hasRootCauseInstanceOf(SQLException.class);
		this.locationRepository.saveAllAndFlush(List.of(
				location("poi-2", null, "attraction"),
				location("poi-3", null, "attraction")));

		var firstPage = this.locationRepository.findAdminPage(null, null, null, PageRequest.of(0, 2));
		var secondPage = this.locationRepository.findAdminPage(null, null, null, PageRequest.of(1, 2));

		assertThat(firstPage.getTotalElements()).isEqualTo(3);
		assertThat(firstPage.getContent()).extracting(PawtripLocation::getPoiId)
			.containsExactly("poi-1", "poi-2");
		assertThat(secondPage.getContent()).extracting(PawtripLocation::getPoiId).containsExactly("poi-3");
	}

	private static PawtripLocation location(String poiId, String regionCode, String typeGroup) {
		return new PawtripLocation(
				poiId,
				poiId,
				typeGroup.equals("attraction") ? "110000" : "050000",
				typeGroup,
				null,
				null,
				null,
				regionCode,
				"{}",
				"{}",
				null,
				null);
	}

}
