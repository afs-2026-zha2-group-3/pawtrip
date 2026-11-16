#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

// Local/test accounts only. Do not reuse these credentials outside development.
const accounts = [
	{ username: "demo", password: "123456", enabled: true, role: "USER" },
	{ username: "admin", password: "123456", enabled: true, role: "ADMIN" },
];

// 验收用宠物档案：demo 两只（一只全部满足、一只超重超高缺证），admin 保持无档案。
const demoPets = [
	{
		name: "豆豆",
		petType: "CAT",
		weightKg: 4.5,
		shoulderHeightCm: 25,
		hasLeash: 1,
		hasVaccinationProof: 1,
	},
	{
		name: "毛毛",
		petType: "DOG",
		weightKg: 38,
		shoulderHeightCm: 55,
		hasLeash: 1,
		hasVaccinationProof: 0,
	},
];

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = resolve(
	repoRoot,
	process.argv[2] ?? process.env.SEED_DB ?? "apps/server/data/pawtrip.db",
);

if (!existsSync(databasePath)) {
	console.error(`Database not found: ${databasePath}`);
	console.error("Start the backend once so Flyway creates the schema, then rerun this script.");
	process.exit(1);
}

const db = new DatabaseSync(databasePath);
const hasTable = db
	.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'app_user'")
	.get();

if (!hasTable) {
	console.error("Table app_user is missing. Run the backend once to apply Flyway migrations.");
	db.close();
	process.exit(1);
}

const upsert = db.prepare(`
	INSERT INTO app_user (username, password_hash, enabled, role)
	VALUES (?, ?, ?, ?)
	ON CONFLICT(username) DO UPDATE SET
		password_hash = excluded.password_hash,
		enabled = excluded.enabled,
		role = excluded.role
`);

const hasPetTable = db
	.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'pet'")
	.get();
const findUserId = db.prepare("SELECT id FROM app_user WHERE username = ?");
const deletePets = db.prepare("DELETE FROM pet WHERE user_id = ?");
const insertPet = db.prepare(`
	INSERT INTO pet (user_id, name, pet_type, weight_kg, shoulder_height_cm, has_leash, has_vaccination_proof)
	VALUES (?, ?, ?, ?, ?, ?, ?)
`);

db.exec("BEGIN");
try {
	for (const { username, password, enabled, role } of accounts) {
		const passwordHash = bcrypt.hashSync(password, 10);
		upsert.run(username, passwordHash, enabled ? 1 : 0, role);
		console.log(`Seeded ${username} (enabled=${enabled}, role=${role})`);
	}

	if (hasPetTable) {
		const demoUser = findUserId.get("demo");
		if (demoUser) {
			deletePets.run(demoUser.id);
			for (const pet of demoPets) {
				insertPet.run(
					demoUser.id,
					pet.name,
					pet.petType,
					pet.weightKg,
					pet.shoulderHeightCm,
					pet.hasLeash,
					pet.hasVaccinationProof,
				);
			}
			console.log(`Seeded ${demoPets.length} pet(s) for demo`);
		}
	}

	db.exec("COMMIT");
} catch (error) {
	db.exec("ROLLBACK");
	throw error;
} finally {
	db.close();
}

console.log(`Seeded ${accounts.length} account(s) into ${databasePath}`);
