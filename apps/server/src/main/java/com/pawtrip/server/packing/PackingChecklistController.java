package com.pawtrip.server.packing;

import java.net.URI;

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
@RequestMapping("/api/trips/{tripId}/packing-checklist")
class PackingChecklistController {

	private final PackingChecklistService checklistService;

	PackingChecklistController(PackingChecklistService checklistService) {
		this.checklistService = checklistService;
	}

	@PostMapping
	ResponseEntity<PackingResponses.Checklist> generate(@PathVariable Long tripId, Authentication authentication) {
		PackingChecklistService.Generated generated = this.checklistService.generate(authentication.getName(),
				tripId);
		if (generated.created()) {
			return ResponseEntity.created(URI.create("/api/trips/" + tripId + "/packing-checklist"))
				.body(generated.checklist());
		}
		return ResponseEntity.ok(generated.checklist());
	}

	@GetMapping
	PackingResponses.Checklist checklist(@PathVariable Long tripId, Authentication authentication) {
		return this.checklistService.read(authentication.getName(), tripId);
	}

	@PostMapping("/items")
	ResponseEntity<PackingResponses.Item> addItem(@PathVariable Long tripId,
			@RequestBody PackingRequests.AddItem request, Authentication authentication) {
		PackingResponses.Item item = this.checklistService.addItem(authentication.getName(), tripId, request);
		return ResponseEntity
			.created(URI.create("/api/trips/" + tripId + "/packing-checklist/items/" + item.id()))
			.body(item);
	}

	@PutMapping("/items/{itemId}")
	PackingResponses.Item updateItem(@PathVariable Long tripId, @PathVariable Long itemId,
			@RequestBody PackingRequests.UpdateItem request, Authentication authentication) {
		return this.checklistService.updateItem(authentication.getName(), tripId, itemId, request);
	}

	@DeleteMapping("/items/{itemId}")
	ResponseEntity<Void> deleteItem(@PathVariable Long tripId, @PathVariable Long itemId,
			Authentication authentication) {
		this.checklistService.deleteItem(authentication.getName(), tripId, itemId);
		return ResponseEntity.noContent().build();
	}

}
