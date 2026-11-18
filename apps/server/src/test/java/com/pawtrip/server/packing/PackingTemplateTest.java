package com.pawtrip.server.packing;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import com.pawtrip.server.pet.Pet;
import com.pawtrip.server.pet.PetType;
import com.pawtrip.server.trip.Trip;

import org.junit.jupiter.api.Test;

class PackingTemplateTest {

	private static final String EMPTY_PLAN = "{\"version\":1,\"days\":[],\"unscheduled\":[]}";

	@Test
	void catOnHighSpeedRailGetsCarrierAndDailyFood() {
		List<PackingTemplate.TemplateItem> items = PackingTemplate.items(trip("high_speed_rail", 3),
				pet(PetType.CAT, 4.5, 25.0, true, false));

		assertThat(find(items, "cat-carrier").name()).isEqualTo("猫用运输包（S 码）");
		assertThat(find(items, "food").quantity()).isEqualTo(6);
		assertThat(keys(items)).doesNotContain("air-crate", "vaccination-proof");
	}

	@Test
	void dogOnFlightGetsCrateAndQuarantineProof() {
		List<PackingTemplate.TemplateItem> items = PackingTemplate.items(trip("flight", 5),
				pet(PetType.DOG, 18.0, 60.0, true, false));

		assertThat(find(items, "air-crate").name()).isEqualTo("航空箱（L 码）");
		assertThat(find(items, "vaccination-proof").name()).isEqualTo("检疫/免疫证明");
		assertThat(find(items, "food").quantity()).isEqualTo(10);
	}

	@Test
	void leashOnlyWhenProfileHasLeashAndScalesByShoulderHeight() {
		assertThat(keys(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.DOG, 18.0, 60.0, false, false)))).doesNotContain("leash");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.DOG, 18.0, 60.0, true, false)), "leash").name()).isEqualTo("牵引绳（L 码）");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 4.5, 30.0, true, false)), "leash").name()).isEqualTo("牵引绳（S 码）");
	}

	@Test
	void vaccinationProofFromProfileOutsideFlightScenario() {
		assertThat(keys(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 4.5, 25.0, true, true)))).contains("vaccination-proof");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 4.5, 25.0, true, true)), "vaccination-proof").name()).isEqualTo("疫苗证明");
	}

	@Test
	void categoriesFollowFixedOrderAndSet() {
		assertThat(PackingTemplate.items(trip("flight", 4), pet(PetType.DOG, 18.0, 60.0, true, false)))
			.extracting(PackingTemplate.TemplateItem::category)
			.containsOnly(PackingCategory.DOCUMENTS, PackingCategory.FOOD, PackingCategory.TRAVEL,
					PackingCategory.HEALTH, PackingCategory.CLEANING);

		List<PackingCategory> order = PackingTemplate.items(trip("flight", 4),
				pet(PetType.DOG, 18.0, 60.0, true, false)).stream()
			.map(PackingTemplate.TemplateItem::category)
			.distinct()
			.toList();
		assertThat(order).containsExactly(PackingCategory.DOCUMENTS, PackingCategory.FOOD, PackingCategory.TRAVEL,
				PackingCategory.HEALTH, PackingCategory.CLEANING);
	}

	@Test
	void boundaryTiersAndScenarioSpecificItems() {
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 5.0, 25.0, true, false)), "cat-carrier").name()).isEqualTo("猫用运输包（S 码）");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 5.1, 25.0, true, false)), "cat-carrier").name()).isEqualTo("猫用运输包（M 码）");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 15.0, 25.0, true, false)), "cat-carrier").name()).isEqualTo("猫用运输包（M 码）");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 15.1, 25.0, true, false)), "cat-carrier").name()).isEqualTo("猫用运输包（L 码）");

		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 4.5, 34.9, true, false)), "leash").name()).isEqualTo("牵引绳（S 码）");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 4.5, 35.0, true, false)), "leash").name()).isEqualTo("牵引绳（M 码）");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 4.5, 54.9, true, false)), "leash").name()).isEqualTo("牵引绳（M 码）");
		assertThat(find(PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.CAT, 4.5, 55.0, true, false)), "leash").name()).isEqualTo("牵引绳（L 码）");

		List<PackingTemplate.TemplateItem> drive = PackingTemplate.items(trip("drive", 2),
				pet(PetType.DOG, 18.0, 60.0, true, false));
		assertThat(keys(drive)).contains("motion-sickness", "poop-bags");
		assertThat(find(drive, "pee-pads").quantity()).isEqualTo(2);

		List<PackingTemplate.TemplateItem> oneDay = PackingTemplate.items(trip("high_speed_rail", 1),
				pet(PetType.CAT, 4.5, 25.0, true, false));
		assertThat(find(oneDay, "pee-pads").quantity()).isEqualTo(1);
		assertThat(find(oneDay, "food").quantity()).isEqualTo(2);

		List<PackingTemplate.TemplateItem> catFlight = PackingTemplate.items(trip("flight", 2),
				pet(PetType.CAT, 4.5, 25.0, true, false));
		assertThat(keys(catFlight)).contains("air-crate").doesNotContain("cat-carrier");

		List<PackingTemplate.TemplateItem> dogRail = PackingTemplate.items(trip("high_speed_rail", 2),
				pet(PetType.DOG, 18.0, 60.0, true, false));
		assertThat(find(dogRail, "dog-carrier").name()).isEqualTo("宠物运输包（L 码）");
	}

	private static PackingTemplate.TemplateItem find(List<PackingTemplate.TemplateItem> items, String key) {
		return items.stream()
			.filter(item -> item.key().equals(key))
			.findFirst()
			.orElseThrow(() -> new AssertionError("Missing template item " + key + " in " + keys(items)));
	}

	private static List<String> keys(List<PackingTemplate.TemplateItem> items) {
		return items.stream().map(PackingTemplate.TemplateItem::key).toList();
	}

	private static Trip trip(String transportMode, int totalDays) {
		return new Trip(1L, "测试行程", "330100", 1L, totalDays, null, transportMode, EMPTY_PLAN);
	}

	private static Pet pet(PetType type, double weightKg, double shoulderHeightCm, boolean hasLeash,
			boolean hasVaccinationProof) {
		return new Pet(1L, "Mimi", type, weightKg, shoulderHeightCm, hasLeash, hasVaccinationProof, null, null, null,
				null);
	}

}
