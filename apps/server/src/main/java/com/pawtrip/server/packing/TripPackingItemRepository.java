package com.pawtrip.server.packing;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TripPackingItemRepository extends JpaRepository<TripPackingItem, Long> {

	List<TripPackingItem> findAllByChecklistIdOrderByIdAsc(Long checklistId);

	Optional<TripPackingItem> findByIdAndChecklistId(Long id, Long checklistId);

	@Query("select coalesce(max(item.sortOrder), 0) from TripPackingItem item where item.checklistId = :checklistId")
	int maxSortOrder(@Param("checklistId") Long checklistId);

}
