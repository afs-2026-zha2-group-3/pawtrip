package com.pawtrip.server.location;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
			ORDER BY id ASC
			""", countQuery = """
			SELECT COUNT(*) FROM pawtrip_location
			WHERE (:regionCode IS NULL
				OR region_code = :regionCode
				OR (:regionLevel = 'province' AND substr(region_code, 1, 2) = substr(:regionCode, 1, 2))
				OR (:regionLevel = 'city' AND substr(region_code, 1, 4) = substr(:regionCode, 1, 4)))
				AND (:typeGroup IS NULL OR type_group = :typeGroup)
			""", nativeQuery = true)
	Page<PawtripLocation> findAdminPage(
			@Param("regionCode") String regionCode,
			@Param("regionLevel") String regionLevel,
			@Param("typeGroup") String typeGroup,
			Pageable pageable);

}
