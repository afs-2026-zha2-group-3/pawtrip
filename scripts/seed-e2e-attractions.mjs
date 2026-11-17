#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

// E2E-only fixtures. Never run this against apps/server/data/pawtrip.db.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = [
	{
		poiId: "e2e-zhu-a",
		name: "情侣路",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "珠海市香洲区",
		longitude: 113.5,
		latitude: 22.1,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: 8.5,
		maxSinglePetShoulderHeightCm: 40,
		leashRequired: 1,
		vaccinationProofRequired: 0,
		extraFeeCents: 1050,
		reservationRequired: null,
		rating: "4.6",
		// 故意先插 order 1：封面必须按 photo_order 取第一张，而非插入顺序。
		photos: [
			{ photoOrder: 1, sourceUrl: "https://photos.e2e.test/a-1.png" },
			{ photoOrder: 0, sourceUrl: "https://photos.e2e.test/a-0.png" },
		],
	},
	{
		poiId: "e2e-zhu-b",
		name: "珠海渔女",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "珠海市香洲区",
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 0,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: 1,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-zhu-c",
		name: "珠海海滨公园",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "珠海市香洲区",
		regionCode: "440400",
		allowedPetTypes: null,
		maxPetsPerPerson: null,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: 1,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-zhu-d",
		name: "珠海无名景点",
		typeCode: "110000",
		typeGroup: "attraction",
		address: null,
		regionCode: "440400",
		allowedPetTypes: null,
		maxPetsPerPerson: null,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-zhu-null-anchor",
		name: "无坐标景点",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "珠海市香洲区",
		longitude: null,
		latitude: null,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-zhu-hotel",
		name: "珠海某酒店",
		typeCode: "100000",
		typeGroup: "hotel",
		address: "珠海市香洲区",
		longitude: 113.5,
		latitude: 22.105,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: 15,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: 1,
		vaccinationProofRequired: 1,
		extraFeeCents: 8000,
		reservationRequired: null,
		rating: "4.8",
		photos: [{ photoOrder: 0, sourceUrl: "https://photos.e2e.test/broken.png" }],
	},
	{
		poiId: "e2e-restaurant-close",
		name: "最近餐厅",
		typeCode: "050000",
		typeGroup: "restaurant",
		address: "珠海市香洲区",
		longitude: 113.5,
		latitude: 22.1005,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 0,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-restaurant-near",
		name: "附近餐厅",
		typeCode: "050000",
		typeGroup: "restaurant",
		address: "珠海市香洲区",
		longitude: 113.5,
		latitude: 22.102,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-restaurant-far",
		name: "远处餐厅",
		typeCode: "050000",
		typeGroup: "restaurant",
		address: "珠海市香洲区",
		longitude: 113.5,
		latitude: 22.16,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-restaurant-null",
		name: "无坐标餐厅",
		typeCode: "050000",
		typeGroup: "restaurant",
		address: "珠海市香洲区",
		longitude: null,
		latitude: null,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-hotel-near",
		name: "附近酒店",
		typeCode: "100000",
		typeGroup: "hotel",
		address: "珠海市香洲区",
		longitude: 113.5,
		latitude: 22.106,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-hotel-far",
		name: "远处酒店",
		typeCode: "100000",
		typeGroup: "hotel",
		address: "珠海市香洲区",
		longitude: 113.5,
		latitude: 22.16,
		regionCode: "440402",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: 15,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: 1,
		vaccinationProofRequired: 1,
		extraFeeCents: 8000,
		reservationRequired: null,
		rating: "4.8",
		photos: [{ photoOrder: 0, sourceUrl: "https://photos.e2e.test/broken.png" }],
	},
	{
		poiId: "e2e-hz-a",
		name: "西湖",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "杭州市西湖区",
		regionCode: "330106",
		allowedPetTypes: "DOG",
		maxPetsPerPerson: 1,
		maxSinglePetWeightKg: 10,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: 1,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-hz-b",
		name: "灵隐寺",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "杭州市西湖区",
		regionCode: "330100",
		allowedPetTypes: null,
		maxPetsPerPerson: 0,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-nj-a",
		name: "中山陵",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "南京市玄武区",
		regionCode: "320102",
		allowedPetTypes: null,
		maxPetsPerPerson: 0,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: null,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
	{
		poiId: "e2e-nj-b",
		name: "玄武湖",
		typeCode: "110000",
		typeGroup: "attraction",
		address: "南京市玄武区",
		regionCode: "320102",
		allowedPetTypes: null,
		maxPetsPerPerson: null,
		maxSinglePetWeightKg: null,
		maxSinglePetShoulderHeightCm: null,
		leashRequired: 1,
		vaccinationProofRequired: null,
		extraFeeCents: null,
		reservationRequired: null,
	},
];

const databasePath = process.argv[2] ? resolve(process.argv[2]) : null;
if (!databasePath) {
	console.error("Usage: node scripts/seed-e2e-attractions.mjs <e2e-db-path>");
	process.exit(1);
}
const defaultDatabasePath = join(repoRoot, "apps", "server", "data", "pawtrip.db");
if (databasePath === defaultDatabasePath) {
	console.error("Refusing to seed E2E fixtures into the development database.");
	process.exit(1);
}
if (!existsSync(databasePath)) {
	console.error(`Database not found: ${databasePath}`);
	process.exit(1);
}

const db = new DatabaseSync(databasePath);
const hasTable = db
	.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pawtrip_location'")
	.get();
if (!hasTable) {
	console.error("Table pawtrip_location is missing. Run the backend once so Flyway creates the schema.");
	db.close();
	process.exit(1);
}

const insert = db.prepare(`
	INSERT INTO pawtrip_location (
		poi_id, name, type_code, type_group, address, longitude, latitude, region_code,
		poi_json, business_json, allowed_pet_types, max_pets_per_person,
		max_single_pet_weight_kg, max_single_pet_shoulder_height_cm,
		leash_required, vaccination_proof_required, extra_fee_cents, reservation_required
	)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, '{}', ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const insertPhoto = db.prepare(`
	INSERT INTO location_photo (location_id, photo_order, source_json, title, source_url)
	VALUES (?, ?, '{}', NULL, ?)
`);
const locationIdByPoiId = db.prepare(
	"SELECT id FROM pawtrip_location WHERE poi_id = ?",
);

db.exec("BEGIN IMMEDIATE");
try {
	// Flyway V19 seeds Zhuhai demo locations into this temporary database; E2E specs expect only fixtures.
	db.exec("DELETE FROM location_photo");
	db.exec("DELETE FROM pawtrip_location");
	for (const fixture of fixtures) {
		insert.run(
			fixture.poiId,
			fixture.name,
			fixture.typeCode,
			fixture.typeGroup,
			fixture.address,
			fixture.longitude ?? null,
			fixture.latitude ?? null,
			fixture.regionCode,
			fixture.rating ? JSON.stringify({ rating: fixture.rating }) : "{}",
			fixture.allowedPetTypes,
			fixture.maxPetsPerPerson,
			fixture.maxSinglePetWeightKg,
			fixture.maxSinglePetShoulderHeightCm,
			fixture.leashRequired,
			fixture.vaccinationProofRequired,
			fixture.extraFeeCents,
			fixture.reservationRequired,
		);
		for (const photo of fixture.photos ?? []) {
			const { id } = locationIdByPoiId.get(fixture.poiId);
			insertPhoto.run(id, photo.photoOrder, photo.sourceUrl);
		}
	}
	db.exec("COMMIT");
} catch (error) {
	db.exec("ROLLBACK");
	db.close();
	throw error;
}

db.close();
console.log(`Seeded ${fixtures.length} E2E attraction fixture(s) into ${databasePath}`);
