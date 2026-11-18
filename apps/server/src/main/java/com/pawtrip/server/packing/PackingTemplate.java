package com.pawtrip.server.packing;

import java.util.ArrayList;
import java.util.List;

import com.pawtrip.server.pet.Pet;
import com.pawtrip.server.pet.PetType;
import com.pawtrip.server.trip.Trip;

final class PackingTemplate {

	private PackingTemplate() {
	}

	record TemplateItem(String key, PackingCategory category, String name, int quantity, int sortOrder) {
	}

	static List<TemplateItem> items(Trip trip, Pet pet) {
		List<TemplateItem> items = new ArrayList<>();
		String transportMode = trip.getTransportMode();
		boolean flight = "flight".equals(transportMode);
		int totalDays = trip.getTotalDays();

		if (pet.hasVaccinationProof() || flight) {
			add(items, "vaccination-proof", PackingCategory.DOCUMENTS,
					flight ? "检疫/免疫证明" : "疫苗证明", 1);
		}

		add(items, "food", PackingCategory.FOOD, "主粮（份）", totalDays * 2);
		add(items, "food-bowl", PackingCategory.FOOD, "折叠食盆", 1);
		add(items, "water-bowl", PackingCategory.FOOD, "便携水碗", 1);

		String crateSize = crateSize(pet.getWeightKg());
		if (flight) {
			add(items, "air-crate", PackingCategory.TRAVEL, "航空箱（" + crateSize + " 码）", 1);
		}
		else if (pet.getPetType() == PetType.CAT) {
			add(items, "cat-carrier", PackingCategory.TRAVEL, "猫用运输包（" + crateSize + " 码）", 1);
		}
		else {
			add(items, "dog-carrier", PackingCategory.TRAVEL, "宠物运输包（" + crateSize + " 码）", 1);
		}
		if (pet.hasLeash()) {
			add(items, "leash", PackingCategory.TRAVEL, "牵引绳（" + leashSize(pet.getShoulderHeightCm()) + " 码）", 1);
		}

		add(items, "first-aid", PackingCategory.HEALTH, "宠物急救包", 1);
		if ("drive".equals(transportMode)) {
			add(items, "motion-sickness", PackingCategory.HEALTH, "宠物晕车药", 1);
		}

		add(items, "pee-pads", PackingCategory.CLEANING, "尿垫", Math.max(1, totalDays));
		if (pet.getPetType() == PetType.DOG) {
			add(items, "poop-bags", PackingCategory.CLEANING, "拾便袋", 1);
		}
		add(items, "wipes", PackingCategory.CLEANING, "清洁湿巾", 1);

		return items;
	}

	private static void add(List<TemplateItem> items, String key, PackingCategory category, String name, int quantity) {
		int sortOrder = category.ordinal() * 100 + items.size();
		items.add(new TemplateItem(key, category, name, quantity, sortOrder));
	}

	private static String crateSize(double weightKg) {
		if (weightKg <= 5.0) {
			return "S";
		}
		if (weightKg <= 15.0) {
			return "M";
		}
		return "L";
	}

	private static String leashSize(double shoulderHeightCm) {
		if (shoulderHeightCm < 35.0) {
			return "S";
		}
		if (shoulderHeightCm < 55.0) {
			return "M";
		}
		return "L";
	}

}
