package com.pawtrip.server.location;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdministrativeRegionRepository extends JpaRepository<AdministrativeRegion, String> {

	List<AdministrativeRegion> findAllByLevelOrderByNameAsc(String level);

	// open-in-view=false：候选接口需在事务内一次性抓取允许品种，避免懒加载异常与逐城 N+1
	@EntityGraph(attributePaths = "allowedDogBreeds")
	List<AdministrativeRegion> findByLevelOrderByNameAsc(String level);

	List<AdministrativeRegion> findAllByOrderByNameAsc();

	boolean existsByParentAdcode(String parentAdcode);

}
