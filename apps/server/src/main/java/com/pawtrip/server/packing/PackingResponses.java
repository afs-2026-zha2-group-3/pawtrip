package com.pawtrip.server.packing;

import java.util.Comparator;
import java.util.List;

import com.pawtrip.server.trip.Trip;

public final class PackingResponses {

	private static final Comparator<TripPackingItem> ITEM_ORDER = Comparator
		.comparingInt((TripPackingItem item) -> item.getCategory().ordinal())
		.thenComparingInt(TripPackingItem::getSortOrder)
		.thenComparing(TripPackingItem::getId);

	private PackingResponses() {
	}

	public record Checklist(Long tripId, String transportMode, int totalDays, String createdAt, String updatedAt,
			Progress progress, List<Item> items) {

		static Checklist from(TripPackingChecklist checklist, Trip trip, List<TripPackingItem> items) {
			List<Item> visible = items.stream()
				.filter(item -> item.getState() == PackingItemState.ACTIVE)
				.sorted(ITEM_ORDER)
				.map(Item::from)
				.toList();
			int checked = (int) visible.stream().filter(Item::checked).count();
			return new Checklist(checklist.getTripId(), trip.getTransportMode(), trip.getTotalDays(),
					checklist.getCreatedAt(), checklist.getUpdatedAt(), new Progress(checked, visible.size()),
					visible);
		}

	}

	public record Progress(int checked, int total) {
	}

	public record Item(Long id, PackingCategory category, String name, int quantity, boolean checked,
			PackingSource source, String templateKey) {

		static Item from(TripPackingItem item) {
			return new Item(item.getId(), item.getCategory(), item.getName(), item.getQuantity(), item.isChecked(),
					item.getSource(), item.getTemplateKey());
		}

	}

}
