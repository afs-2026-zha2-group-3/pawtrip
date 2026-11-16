package com.pawtrip.server.pet;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dog-breeds")
class DogBreedController {

	private final DogBreedRepository dogBreedRepository;

	DogBreedController(DogBreedRepository dogBreedRepository) {
		this.dogBreedRepository = dogBreedRepository;
	}

	@GetMapping
	List<PetResponses.DogBreedDetail> dogBreeds() {
		return this.dogBreedRepository.findAllByOrderByNameAsc()
				.stream()
				.map(PetResponses.DogBreedDetail::from)
				.toList();
	}

}
