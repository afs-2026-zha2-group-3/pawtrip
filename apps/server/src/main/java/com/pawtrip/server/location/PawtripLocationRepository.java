package com.pawtrip.server.location;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PawtripLocationRepository extends JpaRepository<PawtripLocation, Long> {

	Optional<PawtripLocation> findByPoiId(String poiId);

	boolean existsByPoiId(String poiId);

	List<PawtripLocation> findAllByPoiIdIn(Collection<String> poiIds);

	@Query(value = """
			SELECT * FROM pawtrip_location
			WHERE (:regionCode IS NULL
				OR region_code = :regionCode
				OR (:regionLevel = 'province' AND substr(region_code, 1, 2) = substr(:regionCode, 1, 2))
				OR (:regionLevel = 'city' AND substr(region_code, 1, 4) = substr(:regionCode, 1, 4)))
				AND (:typeGroup IS NULL OR type_group = :typeGroup)
				AND (:petFriendlyOnly = 0
					OR type_group IN ('pet-hospital', 'pet-supplies')
					OR max_pets_per_person >= 1)
			ORDER BY id ASC
			""", nativeQuery = true)
	List<PawtripLocation> findLocations(
			@Param("regionCode") String regionCode,
			@Param("regionLevel") String regionLevel,
			@Param("typeGroup") String typeGroup,
			@Param("petFriendlyOnly") int petFriendlyOnly);

}
