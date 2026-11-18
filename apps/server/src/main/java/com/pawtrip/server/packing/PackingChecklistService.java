package com.pawtrip.server.packing;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.pawtrip.server.auth.AppUserRepository;
import com.pawtrip.server.error.ApiErrorCode;
import com.pawtrip.server.error.ApiException;
import com.pawtrip.server.error.UnauthenticatedException;
import com.pawtrip.server.pet.Pet;
import com.pawtrip.server.pet.PetRepository;
import com.pawtrip.server.trip.Trip;
import com.pawtrip.server.trip.TripNotFoundException;
import com.pawtrip.server.trip.TripRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class PackingChecklistService {

	private final TripRepository tripRepository;

	private final PetRepository petRepository;

	private final AppUserRepository appUserRepository;

	private final TripPackingChecklistRepository checklistRepository;

	private final TripPackingItemRepository itemRepository;

	PackingChecklistService(TripRepository tripRepository, PetRepository petRepository,
			AppUserRepository appUserRepository, TripPackingChecklistRepository checklistRepository,
			TripPackingItemRepository itemRepository) {
		this.tripRepository = tripRepository;
		this.petRepository = petRepository;
		this.appUserRepository = appUserRepository;
		this.checklistRepository = checklistRepository;
		this.itemRepository = itemRepository;
	}

	record Generated(PackingResponses.Checklist checklist, boolean created) {
	}

	@Transactional
	Generated generate(String username, long tripId) {
		Long userId = userId(username);
		Trip trip = findTrip(userId, tripId);
		Pet pet = this.petRepository.findByIdAndUserId(trip.getPetId(), userId)
			.orElseThrow(() -> new ApiException(ApiErrorCode.PET_PROFILE_REQUIRED, "Pet profile required"));
		TripPackingChecklist checklist = this.checklistRepository.findByTripId(tripId).orElse(null);
		boolean created = checklist == null;
		if (created) {
			checklist = this.checklistRepository.save(new TripPackingChecklist(tripId));
		}
		sync(checklist, trip, pet);
		return new Generated(response(checklist, trip), created);
	}

	@Transactional
	PackingResponses.Checklist read(String username, long tripId) {
		Long userId = userId(username);
		Trip trip = findTrip(userId, tripId);
		TripPackingChecklist checklist = findChecklist(tripId);
		this.petRepository.findByIdAndUserId(trip.getPetId(), userId)
			.ifPresent(pet -> sync(checklist, trip, pet));
		return response(checklist, trip);
	}

	@Transactional
	PackingResponses.Item addItem(String username, long tripId, PackingRequests.AddItem request) {
		Long userId = userId(username);
		findTrip(userId, tripId);
		TripPackingChecklist checklist = findChecklist(tripId);
		if (request == null) {
			throw invalidItem();
		}
		String name = validName(request.name());
		PackingCategory category = validCategory(request.category());
		int quantity = validQuantity(request.quantity());
		int sortOrder = this.itemRepository.maxSortOrder(checklist.getId()) + 1;
		TripPackingItem saved = this.itemRepository
			.save(TripPackingItem.customItem(checklist.getId(), category, name, quantity, sortOrder));
		checklist.touch();
		this.checklistRepository.save(checklist);
		return PackingResponses.Item.from(saved);
	}

	@Transactional
	PackingResponses.Item updateItem(String username, long tripId, long itemId,
			PackingRequests.UpdateItem request) {
		Long userId = userId(username);
		findTrip(userId, tripId);
		TripPackingChecklist checklist = findChecklist(tripId);
		TripPackingItem item = findItem(checklist, itemId);
		if (request == null || request.isEmpty()) {
			throw invalidItem();
		}
		String name = request.name() == null ? null : validName(request.name());
		PackingCategory category = request.category() == null ? null : validCategory(request.category());
		Integer quantity = request.quantity() == null ? null : validQuantity(request.quantity());
		if (item.getSource() == PackingSource.CUSTOM) {
			item.updateCustom(name, category, quantity, request.checked());
		}
		else {
			item.updateTemplate(quantity, request.checked());
		}
		this.itemRepository.save(item);
		checklist.touch();
		this.checklistRepository.save(checklist);
		return PackingResponses.Item.from(item);
	}

	@Transactional
	void deleteItem(String username, long tripId, long itemId) {
		Long userId = userId(username);
		findTrip(userId, tripId);
		TripPackingChecklist checklist = findChecklist(tripId);
		TripPackingItem item = findItem(checklist, itemId);
		if (item.getSource() == PackingSource.TEMPLATE) {
			item.markDeleted();
			this.itemRepository.save(item);
		}
		else {
			this.itemRepository.delete(item);
		}
		checklist.touch();
		this.checklistRepository.save(checklist);
	}

	private void sync(TripPackingChecklist checklist, Trip trip, Pet pet) {
		List<PackingTemplate.TemplateItem> applicable = PackingTemplate.items(trip, pet);
		Map<String, TripPackingItem> existing = this.itemRepository
			.findAllByChecklistIdOrderByIdAsc(checklist.getId())
			.stream()
			.filter(item -> item.getTemplateKey() != null)
			.collect(Collectors.toMap(TripPackingItem::getTemplateKey, Function.identity(), (first, second) -> first));
		Set<String> applicableKeys = new HashSet<>();
		boolean changed = false;

		for (PackingTemplate.TemplateItem template : applicable) {
			applicableKeys.add(template.key());
			TripPackingItem item = existing.get(template.key());
			if (item == null) {
				this.itemRepository.save(TripPackingItem.templateItem(checklist.getId(), template.category(),
						template.name(), template.quantity(), template.key(), template.sortOrder()));
				changed = true;
			}
			else if (item.getState() == PackingItemState.DELETED) {
				continue;
			}
			else if (item.getState() == PackingItemState.HIDDEN) {
				item.reactivate(template.name(), template.category(), template.quantity(), template.sortOrder());
				this.itemRepository.save(item);
				changed = true;
			}
			else if (item.applyTemplate(template.name(), template.category(), template.quantity(),
					template.sortOrder())) {
				this.itemRepository.save(item);
				changed = true;
			}
		}

		for (TripPackingItem item : existing.values()) {
			if (item.getState() == PackingItemState.ACTIVE && !applicableKeys.contains(item.getTemplateKey())) {
				item.hide();
				this.itemRepository.save(item);
				changed = true;
			}
		}

		if (changed) {
			checklist.touch();
			this.checklistRepository.save(checklist);
		}
	}

	private PackingResponses.Checklist response(TripPackingChecklist checklist, Trip trip) {
		return PackingResponses.Checklist.from(checklist, trip,
				this.itemRepository.findAllByChecklistIdOrderByIdAsc(checklist.getId()));
	}

	private Trip findTrip(Long userId, long tripId) {
		return this.tripRepository.findByIdAndUserId(tripId, userId).orElseThrow(TripNotFoundException::new);
	}

	private TripPackingChecklist findChecklist(long tripId) {
		return this.checklistRepository.findByTripId(tripId)
			.orElseThrow(() -> new ApiException(ApiErrorCode.PACKING_CHECKLIST_NOT_FOUND,
					"Packing checklist not generated"));
	}

	private TripPackingItem findItem(TripPackingChecklist checklist, long itemId) {
		return this.itemRepository.findByIdAndChecklistId(itemId, checklist.getId())
			.orElseThrow(() -> new ApiException(ApiErrorCode.PACKING_ITEM_NOT_FOUND, "Packing item not found"));
	}

	private Long userId(String username) {
		return this.appUserRepository.findByUsername(username)
			.orElseThrow(UnauthenticatedException::new)
			.getId();
	}

	private static String validName(String raw) {
		String name = raw == null ? "" : raw.trim();
		if (name.isEmpty() || name.length() > 50) {
			throw invalidItem();
		}
		return name;
	}

	private static PackingCategory validCategory(String raw) {
		if (raw == null) {
			throw invalidItem();
		}
		try {
			return PackingCategory.valueOf(raw);
		}
		catch (IllegalArgumentException exception) {
			throw invalidItem();
		}
	}

	private static int validQuantity(Integer raw) {
		if (raw == null || raw < 1 || raw > 99) {
			throw invalidItem();
		}
		return raw;
	}

	private static ApiException invalidItem() {
		return new ApiException(ApiErrorCode.VALIDATION_ERROR, "Invalid packing item request");
	}

}
