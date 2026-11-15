package com.pawtrip.server.location;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.SQLException;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.orm.jpa.JpaSystemException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

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

	@BeforeEach
	void clearRepositories() {
		this.photoRepository.deleteAll();
		this.locationRepository.deleteAll();
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
