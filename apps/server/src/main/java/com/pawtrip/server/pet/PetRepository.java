package com.pawtrip.server.pet;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PetRepository extends JpaRepository<Pet, Long> {

	List<Pet> findAllByUserIdOrderByIdAsc(Long userId);

	Optional<Pet> findByIdAndUserId(Long id, Long userId);

}
