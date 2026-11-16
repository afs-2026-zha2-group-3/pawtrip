package com.pawtrip.server.pet;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DogBreedRepository extends JpaRepository<DogBreed, Long> {

	List<DogBreed> findAllByOrderByNameAsc();

}
