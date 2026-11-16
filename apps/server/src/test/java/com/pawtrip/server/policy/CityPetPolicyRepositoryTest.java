package com.pawtrip.server.policy;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;

import com.pawtrip.server.location.AdministrativeRegion;
import com.pawtrip.server.location.AdministrativeRegionRepository;
import com.pawtrip.server.pet.DogBreed;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@SpringBootTest
class CityPetPolicyRepositoryTest {

	private static final Path DB_PATH = Path.of("target", "city-pet-policy-repository-test.db");

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
	CityPetPolicyRepository policyRepository;

	@Autowired
	AdministrativeRegionRepository regionRepository;

	@Autowired
	EntityManager entityManager;

	@BeforeEach
	@AfterEach
	void removeTestPolicy() {
		this.policyRepository.deleteById("990004");
		this.regionRepository.deleteById("990004");
	}

	@Test
	void persistsAndReadsPolicyValues() {
		this.regionRepository.saveAndFlush(new AdministrativeRegion("990004", "Test region", null, "province", null));
		this.policyRepository.saveAndFlush(new CityPetPolicy("990004", "严格管理区", "[\"禁止饲养危险犬\"]",
				"测试来源", null, "2025-07"));
		this.entityManager.clear();

		var persisted = this.policyRepository.findById("990004").orElseThrow();

		assertThat(persisted.getAreaScope()).isEqualTo("严格管理区");
		assertThat(persisted.getPoliciesJson()).isEqualTo("[\"禁止饲养危险犬\"]");
		assertThat(persisted.getBannedDogBreeds()).isEmpty();
		assertThat(persisted.getSourceTitle()).isEqualTo("测试来源");
		assertThat(persisted.getSourceNote()).isNull();
		assertThat(persisted.getUpdatedMonth()).isEqualTo("2025-07");
	}

	@Test
	void readsSeededZhuhaiPolicyWithSelectableBannedBreeds() {
		var policy = this.policyRepository.findById("440400").orElseThrow();

		assertThat(policy.getAreaScope()).isEqualTo("严格管理区");
		assertThat(policy.getBannedDogBreeds())
			.hasSize(8)
			.extracting(DogBreed::getName)
			.containsExactlyInAnyOrder("比特犬", "藏獒", "德国牧羊犬", "罗威纳犬", "杜宾犬", "秋田犬", "高加索犬",
					"卡斯罗犬");
	}

}
