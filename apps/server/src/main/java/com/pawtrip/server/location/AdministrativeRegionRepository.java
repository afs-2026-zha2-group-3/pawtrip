package com.pawtrip.server.location;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministrativeRegionRepository extends JpaRepository<AdministrativeRegion, String> {

	List<AdministrativeRegion> findAllByLevelOrderByNameAsc(String level);

	List<AdministrativeRegion> findAllByPolicyCoveredTrueOrderByAdcodeAsc();

}
