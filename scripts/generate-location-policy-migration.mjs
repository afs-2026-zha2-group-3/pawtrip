#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MIGRATIONS_DIR = resolve(
	repoRoot, "apps", "server", "src", "main", "resources", "db", "migration",
);
const DEFAULT_OUT = resolve(DEFAULT_MIGRATIONS_DIR, "V31__seed_zhuhai_location_pet_policies.sql");
const DEFAULT_REGION_PREFIX = "4404";
const TYPE_ORDER = ["attraction", "hotel", "restaurant"];
const ALLOWED_PET_TYPES = new Set(["CAT", "DOG", "CAT,DOG"]);
const POLICY_COLUMNS = [
	"allowed_pet_types",
	"max_pets_per_person",
	"max_single_pet_weight_kg",
	"max_single_pet_shoulder_height_cm",
	"leash_required",
	"vaccination_proof_required",
	"extra_fee_cents",
	"reservation_required",
];

// 每类地点轮流套用；数值为演示用，非真实门店政策。
const PRESETS = {
	attraction: [
		{
			label: "开放式公园",
			allowedPetTypes: "CAT,DOG",
			maxPetsPerPerson: 2,
			maxSinglePetWeightKg: 30,
			maxSinglePetShoulderHeightCm: 60,
			leashRequired: 0,
			vaccinationProofRequired: 0,
			extraFeeCents: 0,
			reservationRequired: 0,
		},
		{
			label: "市政公园",
			allowedPetTypes: "CAT,DOG",
			maxPetsPerPerson: 2,
			maxSinglePetWeightKg: 20,
			maxSinglePetShoulderHeightCm: 50,
			leashRequired: 1,
			vaccinationProofRequired: 0,
			extraFeeCents: 0,
			reservationRequired: 0,
		},
		{
			label: "收费景区",
			allowedPetTypes: "DOG",
			maxPetsPerPerson: 1,
			maxSinglePetWeightKg: 20,
			maxSinglePetShoulderHeightCm: 50,
			leashRequired: 1,
			vaccinationProofRequired: 1,
			extraFeeCents: 3000,
			reservationRequired: 1,
		},
		{
			label: "山野景区",
			allowedPetTypes: "DOG",
			maxPetsPerPerson: 1,
			maxSinglePetWeightKg: 15,
			maxSinglePetShoulderHeightCm: 45,
			leashRequired: 1,
			vaccinationProofRequired: 1,
			extraFeeCents: 0,
			reservationRequired: 0,
		},
	],
	hotel: [
		{
			label: "宠物友好",
			allowedPetTypes: "CAT,DOG",
			maxPetsPerPerson: 2,
			maxSinglePetWeightKg: 25,
			maxSinglePetShoulderHeightCm: 55,
			leashRequired: 1,
			vaccinationProofRequired: 1,
			extraFeeCents: 0,
			reservationRequired: 1,
		},
		{
			label: "标准宠物房",
			allowedPetTypes: "CAT,DOG",
			maxPetsPerPerson: 1,
			maxSinglePetWeightKg: 15,
			maxSinglePetShoulderHeightCm: 45,
			leashRequired: 1,
			vaccinationProofRequired: 1,
			extraFeeCents: 5000,
			reservationRequired: 1,
		},
		{
			label: "高端宠物房",
			allowedPetTypes: "CAT,DOG",
			maxPetsPerPerson: 2,
			maxSinglePetWeightKg: 30,
			maxSinglePetShoulderHeightCm: 60,
			leashRequired: 1,
			vaccinationProofRequired: 1,
			extraFeeCents: 20000,
			reservationRequired: 1,
		},
		{
			label: "小型犬房",
			allowedPetTypes: "DOG",
			maxPetsPerPerson: 1,
			maxSinglePetWeightKg: 8,
			maxSinglePetShoulderHeightCm: 35,
			leashRequired: 1,
			vaccinationProofRequired: 0,
			extraFeeCents: 8000,
			reservationRequired: 0,
		},
	],
	restaurant: [
		{
			label: "宠物友好",
			allowedPetTypes: "CAT,DOG",
			maxPetsPerPerson: 1,
			maxSinglePetWeightKg: 15,
			maxSinglePetShoulderHeightCm: 40,
			leashRequired: 1,
			vaccinationProofRequired: 0,
			extraFeeCents: 0,
			reservationRequired: 0,
		},
		{
			label: "户外座位",
			allowedPetTypes: "DOG",
			maxPetsPerPerson: 1,
			maxSinglePetWeightKg: 20,
			maxSinglePetShoulderHeightCm: 50,
			leashRequired: 1,
			vaccinationProofRequired: 0,
			extraFeeCents: 0,
			reservationRequired: 0,
		},
		{
			label: "需预约",
			allowedPetTypes: "DOG",
			maxPetsPerPerson: 2,
			maxSinglePetWeightKg: 25,
			maxSinglePetShoulderHeightCm: 55,
			leashRequired: 1,
			vaccinationProofRequired: 1,
			extraFeeCents: 5000,
			reservationRequired: 1,
		},
	],
};

function parseArgs(argv) {
	const options = {
		migrationsDir: DEFAULT_MIGRATIONS_DIR,
		outPath: DEFAULT_OUT,
		regionPrefix: DEFAULT_REGION_PREFIX,
		help: false,
	};
	for (const argument of argv) {
		if (argument === "--help" || argument === "-h") {
			options.help = true;
		} else if (argument.startsWith("--out=")) {
			options.outPath = resolve(argument.slice("--out=".length));
		} else if (argument.startsWith("--migrations=")) {
			options.migrationsDir = resolve(argument.slice("--migrations=".length));
		} else if (argument.startsWith("--region=")) {
			options.regionPrefix = argument.slice("--region=".length).trim();
		} else {
			throw new Error(`Unknown argument: ${argument}`);
		}
	}
	if (!/^\d{4,6}$/.test(options.regionPrefix)) {
		throw new Error("--region must be a 4- or 6-digit adcode prefix");
	}
	const outputVersion = /^V(\d+)__/.exec(basename(options.outPath));
	if (!outputVersion) {
		throw new Error("--out must use a Flyway name such as V31__description.sql");
	}
	options.outputVersion = Number(outputVersion[1]);
	return options;
}

function printHelp() {
	console.log(`Usage: node scripts/generate-location-policy-migration.mjs [options]

Replay Flyway migrations into an in-memory SQLite database, then emit an UPDATE
migration that applies preset pet-entry policies to Zhuhai locations.

Options:
  --migrations=path      Migration directory (default: apps/server/src/main/resources/db/migration)
  --out=path             Migration file to write (default: V31__seed_zhuhai_location_pet_policies.sql)
  --region=4404          Region adcode prefix to target (default: 4404, Zhuhai)
  -h, --help             Show this help
`);
}

function validatePresets() {
	for (const group of Object.keys(PRESETS)) {
		if (!TYPE_ORDER.includes(group)) {
			throw new Error(`Unsupported preset type_group: ${group}`);
		}
		for (const preset of PRESETS[group]) {
			if (!ALLOWED_PET_TYPES.has(preset.allowedPetTypes)) {
				throw new Error(`${group}/${preset.label}: invalid allowed_pet_types`);
			}
			for (const field of ["maxPetsPerPerson", "extraFeeCents"]) {
				if (!Number.isInteger(preset[field]) || preset[field] < 0) {
					throw new Error(`${group}/${preset.label}: ${field} must be a non-negative integer`);
				}
			}
			for (const field of ["maxSinglePetWeightKg", "maxSinglePetShoulderHeightCm"]) {
				if (!Number.isFinite(preset[field]) || preset[field] < 0) {
					throw new Error(`${group}/${preset.label}: ${field} must be a non-negative number`);
				}
			}
			for (const field of ["leashRequired", "vaccinationProofRequired", "reservationRequired"]) {
				if (preset[field] !== 0 && preset[field] !== 1) {
					throw new Error(`${group}/${preset.label}: ${field} must be 0 or 1`);
				}
			}
		}
	}
}

function migrationVersion(fileName) {
	const match = /^V(\d+)__/.exec(fileName);
	if (!match) {
		throw new Error(`Invalid migration file name: ${fileName}`);
	}
	return Number(match[1]);
}

function openMigratedDatabase(migrationsDir, maxVersionExclusive) {
	if (!existsSync(migrationsDir)) {
		throw new Error(`Migration directory not found: ${migrationsDir}`);
	}
	const files = readdirSync(migrationsDir)
		.filter((fileName) => /^V\d+__.*\.sql$/.test(fileName))
		.filter((fileName) => migrationVersion(fileName) < maxVersionExclusive)
		.sort((left, right) => migrationVersion(left) - migrationVersion(right));
	if (files.length === 0) {
		throw new Error(`No migration files found in ${migrationsDir}`);
	}

	const db = new DatabaseSync(":memory:");
	try {
		for (const fileName of files) {
			try {
				db.exec(readFileSync(join(migrationsDir, fileName), "utf8"));
			} catch (error) {
				throw new Error(`Failed to replay ${fileName}: ${error.message}`);
			}
		}
		return { db, migrationCount: files.length };
	} catch (error) {
		db.close();
		throw error;
	}
}

function loadLocations(db, regionPrefix) {
	const rows = db.prepare(`
		SELECT id, poi_id, type_group, ${POLICY_COLUMNS.join(", ")}
		FROM pawtrip_location
		WHERE region_code LIKE ?
		  AND poi_id NOT LIKE 'e2e-%'
		  AND poi_id NOT LIKE 'test-zhu-%'
		  AND type_group IN (${TYPE_ORDER.map(() => "?").join(", ")})
		ORDER BY id
	`).all(`${regionPrefix}%`, ...TYPE_ORDER);
	if (rows.length === 0) {
		throw new Error(`No locations match region prefix ${regionPrefix}.`);
	}
	return rows;
}

function hasAnyPolicy(row) {
	return POLICY_COLUMNS.some((column) => row[column] !== null && row[column] !== undefined);
}

function assignPresets(rows) {
	const batches = new Map();
	const summary = new Map(TYPE_ORDER.map((group) => [group, { total: 0, updated: 0, skipped: 0 }]));

	for (const row of rows) {
		if (!TYPE_ORDER.includes(row.type_group)) {
			continue;
		}
		const presets = PRESETS[row.type_group];
		const stats = summary.get(row.type_group);
		const presetIndex = stats.total % presets.length;
		stats.total += 1;
		if (hasAnyPolicy(row)) {
			stats.skipped += 1;
			continue;
		}
		stats.updated += 1;
		const key = `${row.type_group}:${presetIndex}`;
		if (!batches.has(key)) {
			batches.set(key, []);
		}
		batches.get(key).push({ poiId: row.poi_id, preset: presets[presetIndex] });
	}

	return { batches, summary };
}

function sqlString(value) {
	return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlValue(value) {
	return value === null || value === undefined
		? "NULL"
		: typeof value === "number" ? String(value) : sqlString(value);
}

function buildUpdate(poiId, preset) {
	const assignments = [
		`allowed_pet_types = ${sqlValue(preset.allowedPetTypes)}`,
		`max_pets_per_person = ${sqlValue(preset.maxPetsPerPerson)}`,
		`max_single_pet_weight_kg = ${sqlValue(preset.maxSinglePetWeightKg)}`,
		`max_single_pet_shoulder_height_cm = ${sqlValue(preset.maxSinglePetShoulderHeightCm)}`,
		`leash_required = ${sqlValue(preset.leashRequired)}`,
		`vaccination_proof_required = ${sqlValue(preset.vaccinationProofRequired)}`,
		`extra_fee_cents = ${sqlValue(preset.extraFeeCents)}`,
		`reservation_required = ${sqlValue(preset.reservationRequired)}`,
	].join(", ");
	const guard = POLICY_COLUMNS.map((column) => `${column} IS NULL`).join(" AND ");
	return `UPDATE pawtrip_location\nSET ${assignments}\nWHERE poi_id = ${sqlString(poiId)} AND ${guard};`;
}

function buildMigration(batches, summary, regionPrefix, migrationCount) {
	const totalUpdated = [...summary.values()].reduce((total, stats) => total + stats.updated, 0);
	const totalSkipped = [...summary.values()].reduce((total, stats) => total + stats.skipped, 0);
	const lines = [
		"-- 珠海地点宠物准入政策数据（V31），由 scripts/generate-location-policy-migration.mjs 生成；请勿手工编辑。",
		`-- 来源：按版本重放 ${migrationCount} 个 Flyway migration 得到的注入数据，行政区前缀 ${regionPrefix}。`,
		"-- 仅覆盖 attraction/hotel/restaurant，跳过 test-zhu-* 及任一政策字段已有值的记录。",
		`-- 更新 ${totalUpdated} 条，跳过已有政策 ${totalSkipped} 条：`
			+ TYPE_ORDER.map((group) => {
				const stats = summary.get(group);
				return `${group} ${stats.updated}/${stats.total}`;
			}).join("，")
			+ "。",
		"",
	];

	for (const group of TYPE_ORDER) {
		const presets = PRESETS[group];
		for (let presetIndex = 0; presetIndex < presets.length; presetIndex += 1) {
			const batch = batches.get(`${group}:${presetIndex}`) ?? [];
			if (batch.length === 0) {
				continue;
			}
			lines.push(
				`-- ${group} 预设 ${presetIndex + 1}：${presets[presetIndex].label}（${batch.length} 条）`,
				"",
			);
			for (const entry of batch) {
				lines.push(buildUpdate(entry.poiId, entry.preset), "");
			}
		}
	}

	return `${lines.join("\n")}\n`;
}

function main() {
	const options = parseArgs(process.argv.slice(2));
	if (options.help) {
		printHelp();
		return;
	}
	validatePresets();

	const { db, migrationCount } = openMigratedDatabase(options.migrationsDir, options.outputVersion);
	let rows;
	try {
		rows = loadLocations(db, options.regionPrefix);
	} finally {
		db.close();
	}

	const { batches, summary } = assignPresets(rows);
	const totalUpdated = [...summary.values()].reduce((total, stats) => total + stats.updated, 0);
	if (totalUpdated === 0) {
		throw new Error("No locations need pet policy updates.");
	}

	const sql = buildMigration(batches, summary, options.regionPrefix, migrationCount);
	writeFileSync(options.outPath, sql, "utf8");

	const relativePath = relative(repoRoot, options.outPath);
	console.log(`Wrote ${totalUpdated} update(s) to ${relativePath}`);
	for (const group of TYPE_ORDER) {
		const stats = summary.get(group);
		console.log(`  ${group}: updated ${stats.updated}, skipped ${stats.skipped}, total ${stats.total}`);
	}
}

main();