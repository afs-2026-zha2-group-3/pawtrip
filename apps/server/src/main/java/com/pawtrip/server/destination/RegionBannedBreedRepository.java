package com.pawtrip.server.destination;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RegionBannedBreedRepository extends JpaRepository<RegionBannedBreed, Long> {

	List<RegionBannedBreed> findAllByRegionAdcodeOrderByIdAsc(String regionAdcode);

}