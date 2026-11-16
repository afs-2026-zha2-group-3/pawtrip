package com.pawtrip.server.pet;

import java.net.URI;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pets")
class PetController {

	private final PetService petService;

	PetController(PetService petService) {
		this.petService = petService;
	}

	@GetMapping
	List<PetResponses.PetDetail> pets(Authentication authentication) {
		return this.petService.pets(authentication.getName());
	}

	@GetMapping("/{petId}")
	PetResponses.PetDetail pet(@PathVariable Long petId, Authentication authentication) {
		return this.petService.pet(authentication.getName(), petId);
	}

	@PostMapping
	ResponseEntity<PetResponses.PetDetail> create(@RequestBody PetRequests.SavePet request,
			Authentication authentication) {
		PetResponses.PetDetail pet = this.petService.create(authentication.getName(), request);
		return ResponseEntity.created(URI.create("/api/pets/" + pet.id())).body(pet);
	}

	@PutMapping("/{petId}")
	PetResponses.PetDetail update(@PathVariable Long petId, @RequestBody PetRequests.SavePet request,
			Authentication authentication) {
		return this.petService.update(authentication.getName(), petId, request);
	}

	@DeleteMapping("/{petId}")
	ResponseEntity<Void> delete(@PathVariable Long petId, Authentication authentication) {
		this.petService.delete(authentication.getName(), petId);
		return ResponseEntity.noContent().build();
	}

}
