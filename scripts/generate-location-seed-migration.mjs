#!/usr/bin/env node
import { existsSync, writeFileSync } from "node:fs";
import { basename, dirname, relative, resolve, sep } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_DB_PATH = resolve(repoRoot, "apps", "server", "data", "pawtrip.db");
const DEFAULT_OUT = resolve(
	repoRoot,
	"apps", "server", "src", "main", "resources", "db", "migration", "V19__seed_zhuha_locations.sql",
);
const TYPE_GROUPS = new Set(["attraction", "hotel", "pet-hospital", "pet-supplies", "restaurant"]);
const ALLOWED_PET_TYPES = new Set(["CAT", "DOG", "CAT,DOG"]);

function parseArgs(argv) {
	const options = { dbPath: DEFAULT_DB_PATH, outPath: DEFAULT_OUT, regionPrefix: "4404", help: false };
	for (const argument of argv) {
		if (argument === "--help" || argument === "-h") {
			options.help = true;
		} else if (argument.startsWith("--db=")) {
			options.dbPath = resolve(argument.slice("--db=".length));
		} else if (argument.startsWith("--out=")) {
			options.outPath = resolve(argument.slice("--out=".length));
		} else if (argument.startsWith("--region=")) {
			options.regionPrefix = argument.slice("--region=".length).trim();
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}
	if (!/^\d{4,6}$/.test(options.regionPrefix)) {
		throw new Error("--region must be a 4- or 6-digit adcode prefix");
	}
	return options;
}

function printHelp() {
	console.log(`Usage: node scripts/generate-location-seed-migration.mjs [options]

Read saved locations from a Pawtrip SQLite database and emit a Flyway migration
that seeds them with ON CONFLICT(poi_id) DO NOTHING.

Options:
  --db=path              Source SQLite database (default: apps/server/data/pawtrip.db)
  --out=path             Migration file to write (default: V19__seed_zhuha_locations.sql)
  --region=4404          Region adcode prefix to export (default: 4404, Zhuhai)
  -h, --help             Show this help
`);
}

function openSource(databasePath) {
	if (!existsSync(databasePath)) {
		throw new Error(`Database not found: ${databasePath}`);
	}
	const db = new DatabaseSync(databasePath);
	const hasTable = db.prepare(
		"SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pawtrip_location'",
	).get();
	if (!hasTable) {
		db.close();
		throw new Error("Table pawtrip_location is missing in the source database.");
	}
	return db;
}

function requireString(value, field, poiId) {
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`poi_id ${poiId}: ${field} must be a non-empty string`);
	}
	return value;
}

function requireJson(value, field, poiId) {
	const text = requireString(value, field, poiId);
	try {
		JSON.parse(text);
	} catch {
		throw new Error(`poi_id ${poiId}: ${field} is not valid JSON`);
	}
	return text;
}

function optionalNumber(value, field, poiId, { min, max, integer } = {}) {
	if (value === null || value === undefined) {
		return null;
	}
	const number = Number(value);
	if (!Number.isFinite(number)
		|| (integer && !Number.isInteger(number))
		|| (min !== undefined && number < min)
		|| (max !== undefined && number > max)) {
		throw new Error(`poi_id ${poiId}: ${field} has invalid value ${value}`);
	}
	return number;
}

function loadLocations(db, regionPrefix) {
	const rows = db.prepare(`
		SELECT poi_id, name, type_code, type_group, address, longitude, latitude, region_code,
		       poi_json, business_json, min_visit_hours, max_visit_hours,
		       allowed_pet_types, max_pets_per_person, max_single_pet_weight_kg,
		       max_single_pet_shoulder_height_cm, leash_required, vaccination_proof_required,
		       extra_fee_cents, reservation_required
		FROM pawtrip_location
		WHERE region_code LIKE ? AND poi_id NOT LIKE 'e2e-%'
		ORDER BY id
	`).all(`${regionPrefix}%`);
	if (rows.length === 0) {
		throw new Error(`No locations match region prefix ${regionPrefix}.`);
	}

	return rows.map((row) => {
		const poiId = requireString(row.poi_id, "poi_id", row.poi_id ?? "<unknown>");
		if (!/^[A-Za-z0-9_-]{1,64}$/.test(poiId)) {
			throw new Error(`Invalid poi_id: ${poiId}`);
		}
		if (!TYPE_GROUPS.has(row.type_group)) {
			throw new Error(`poi_id ${poiId}: unsupported type_group ${row.type_group}`);
		}
		if (typeof row.region_code !== "string" || !/^\d{6}$/.test(row.region_code)) {
			throw new Error(`poi_id ${poiId}: region_code must be a 6-digit adcode`);
		}
		if (row.allowed_pet_types !== null && !ALLOWED_PET_TYPES.has(row.allowed_pet_types)) {
			throw new Error(`poi_id ${poiId}: unsupported allowed_pet_types ${row.allowed_pet_types}`);
		}
		const minVisitHours = optionalNumber(row.min_visit_hours, "min_visit_hours", poiId, { integer: true, min: 0 });
		const maxVisitHours = optionalNumber(row.max_visit_hours, "max_visit_hours", poiId, { integer: true, min: 0 });
		if (minVisitHours !== null && maxVisitHours !== null && minVisitHours > maxVisitHours) {
			throw new Error(`poi_id ${poiId}: min_visit_hours exceeds max_visit_hours`);
		}
		for (const flag of ["leash_required", "vaccination_proof_required", "reservation_required"]) {
			const value = row[flag];
			if (value !== null && value !== 0 && value !== 1) {
				throw new Error(`poi_id ${poiId}: ${flag} must be 0, 1 or NULL`);
			}
		}
		return {
			poiId,
			name: requireString(row.name, "name", poiId),
			typeCode: requireString(row.type_code, "type_code", poiId),
			typeGroup: row.type_group,
			address: row.address,
			longitude: optionalNumber(row.longitude, "longitude", poiId, { min: -180, max: 180 }),
			latitude: optionalNumber(row.latitude, "latitude", poiId, { min: -90, max: 90 }),
			regionCode: row.region_code,
			poiJson: requireJson(row.poi_json, "poi_json", poiId),
			businessJson: requireJson(row.business_json, "business_json", poiId),
			minVisitHours,
			maxVisitHours,
			allowedPetTypes: row.allowed_pet_types,
			maxPetsPerPerson: optionalNumber(row.max_pets_per_person, "max_pets_per_person", poiId, { integer: true, min: 0 }),
			maxSinglePetWeightKg: optionalNumber(row.max_single_pet_weight_kg, "max_single_pet_weight_kg", poiId, { min: 0 }),
			maxSinglePetShoulderHeightCm: optionalNumber(row.max_single_pet_shoulder_height_cm,
				"max_single_pet_shoulder_height_cm", poiId, { min: 0 }),
			leashRequired: row.leash_required,
			vaccinationProofRequired: row.vaccination_proof_required,
			extraFeeCents: optionalNumber(row.extra_fee_cents, "extra_fee_cents", poiId, { integer: true, min: 0 }),
			reservationRequired: row.reservation_required,
		};
	});
}

function loadPhotos(db, regionPrefix) {
	const rows = db.prepare(`
		SELECT l.poi_id, p.photo_order, p.source_json, p.title, p.source_url
		FROM location_photo p
		JOIN pawtrip_location l ON l.id = p.location_id
		WHERE l.region_code LIKE ? AND l.poi_id NOT LIKE 'e2e-%'
		ORDER BY l.id, p.photo_order
	`).all(`${regionPrefix}%`);
	return rows.map((row) => {
		if (!Number.isInteger(row.photo_order) || row.photo_order < 0) {
			throw new Error(`poi_id ${row.poi_id}: invalid photo_order ${row.photo_order}`);
		}
		return {
			poiId: requireString(row.poi_id, "poi_id", row.poi_id),
			photoOrder: row.photo_order,
			sourceJson: requireJson(row.source_json, "source_json", row.poi_id),
			title: row.title,
			sourceUrl: requireString(row.source_url, "source_url", row.poi_id),
		};
	});
}

function sqlString(value) {
	if (value === null || value === undefined) {
		return "NULL";
	}
	return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlValue(value) {
	return typeof value === "number" ? String(value) : sqlString(value);
}

function buildMigration(locations, photos, sourceLabel, regionPrefix) {
	const lines = [
		"-- 珠海地点种子数据，由 scripts/generate-location-seed-migration.mjs 生成；请勿手工编辑。",
		`-- 来源：${sourceLabel}，行政区前缀 ${regionPrefix}。`,
		`-- 地点 ${locations.length} 条、照片 ${photos.length} 张；已存在的 poi_id 保留后台编辑结果。`,
		"",
	];
	const columns = [
		"poi_id", "name", "type_code", "type_group", "address", "longitude", "latitude", "region_code",
		"poi_json", "business_json", "min_visit_hours", "max_visit_hours", "allowed_pet_types",
		"max_pets_per_person", "max_single_pet_weight_kg", "max_single_pet_shoulder_height_cm",
		"leash_required", "vaccination_proof_required", "extra_fee_cents", "reservation_required",
	];
	for (const location of locations) {
		const values = [
			location.poiId, location.name, location.typeCode, location.typeGroup, location.address,
			location.longitude, location.latitude, location.regionCode, location.poiJson, location.businessJson,
			location.minVisitHours, location.maxVisitHours, location.allowedPetTypes,
			location.maxPetsPerPerson, location.maxSinglePetWeightKg, location.maxSinglePetShoulderHeightCm,
			location.leashRequired, location.vaccinationProofRequired, location.extraFeeCents,
			location.reservationRequired,
		].map(sqlValue);
		lines.push(
			`INSERT INTO pawtrip_location (${columns.join(", ")}) VALUES (${values.join(", ")}) `
				+ "ON CONFLICT(poi_id) DO NOTHING;",
		);
	}
	if (photos.length > 0) {
		lines.push("");
	}
	for (const photo of photos) {
		lines.push(
			"INSERT OR IGNORE INTO location_photo (location_id, photo_order, source_json, title, source_url) "
				+ `SELECT id, ${photo.photoOrder}, ${sqlString(photo.sourceJson)}, ${sqlString(photo.title)}, `
				+ `${sqlString(photo.sourceUrl)} FROM pawtrip_location WHERE poi_id = ${sqlString(photo.poiId)};`,
		);
	}
	return `${lines.join("\n")}\n`;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}
	const db = openSource(options.dbPath);
	let locations;
	let photos;
	try {
		locations = loadLocations(db, options.regionPrefix);
		photos = loadPhotos(db, options.regionPrefix);
	} finally {
		db.close();
	}

	const relativePath = relative(repoRoot, options.dbPath);
	const sourceLabel = relativePath.startsWith("..") ? basename(options.dbPath) : relativePath.split(sep).join("/");
	const sql = buildMigration(locations, photos, sourceLabel, options.regionPrefix);
	writeFileSync(options.outPath, sql, "utf8");
	console.log(`Wrote ${locations.length} location(s) and ${photos.length} photo(s) to ${options.outPath}`);
}

main();
