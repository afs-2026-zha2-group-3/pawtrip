#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

// Local/test accounts only. Do not reuse these credentials outside development.
const baseAccounts = [
	{ username: "demo", password: "123456", enabled: true, role: "USER" },
	{ username: "admin", password: "123456", enabled: true, role: "ADMIN" },
	{ username: "petowner", password: "123456", enabled: true, role: "USER" },
];

// E2E 并行时每个 Playwright worker 使用独立账号，避免共享行程/宠物互相覆盖。
const workerCount = Number(process.env.SEED_E2E_WORKERS ?? "0");
if (!Number.isInteger(workerCount) || workerCount < 0 || workerCount > 16) {
	console.error("SEED_E2E_WORKERS must be an integer between 0 and 16.");
	process.exit(1);
}
const workerAccounts = Array.from({ length: workerCount }, (_, index) => ({
	username: `petowner-w${index}`,
	password: "123456",
	enabled: true,
	role: "USER",
}));
const accounts = [...baseAccounts, ...workerAccounts];

// 验收用宠物档案：petowner 与各 E2E worker 账号各两只（一只全部满足、一只超重超高缺证）。
// demo 与 admin 保持无档案，避免与已有的「空档案 → 新建」流程相冲突。
const petOwnerPets = [
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
const defaultDatabasePath = resolve(repoRoot, "apps/server/data/pawtrip.db");
const databasePath = resolve(
	repoRoot,
	process.argv[2] ?? process.env.SEED_DB ?? "apps/server/data/pawtrip.db",
);

if (workerCount > 0 && databasePath === defaultDatabasePath) {
	console.error("Refusing to seed E2E worker accounts into the development database.");
	process.exit(1);
}

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
	const passwordHashes = new Map();
	for (const { username, password, enabled, role } of accounts) {
		if (!passwordHashes.has(password)) {
			passwordHashes.set(password, bcrypt.hashSync(password, 10));
		}
		upsert.run(username, passwordHashes.get(password), enabled ? 1 : 0, role);
	}

	if (hasPetTable) {
		const petOwnerUsernames = new Set([
			"petowner",
			...workerAccounts.map(({ username }) => username),
		]);
		for (const { username } of accounts) {
			if (!petOwnerUsernames.has(username)) continue;
			const owner = findUserId.get(username);
			if (!owner) continue;
			deletePets.run(owner.id);
			for (const pet of petOwnerPets) {
				insertPet.run(
					owner.id,
					pet.name,
					pet.petType,
					pet.weightKg,
					pet.shoulderHeightCm,
					pet.hasLeash,
					pet.hasVaccinationProof,
				);
			}
		}
		console.log(
			`Seeded ${petOwnerPets.length} pet(s) for ${petOwnerUsernames.size} pet owner account(s)`,
		);
	}

	db.exec("COMMIT");
} catch (error) {
	db.exec("ROLLBACK");
	throw error;
} finally {
	db.close();
}

console.log(`Seeded ${accounts.length} account(s) into ${databasePath}`);
