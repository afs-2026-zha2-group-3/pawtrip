package com.pawtrip.server.packing;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TripPackingChecklistRepository extends JpaRepository<TripPackingChecklist, Long> {

	Optional<TripPackingChecklist> findByTripId(Long tripId);

}
