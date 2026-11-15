#!/usr/bin/env node
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";

// Local/test accounts only. Do not reuse these credentials outside development.
const accounts = [
	{ username: "demo", password: "pawtrip-demo", enabled: true, role: "USER" },
	{ username: "tester", password: "pawtrip-test", enabled: true, role: "USER" },
	{ username: "admin", password: "pawtrip-admin", enabled: true, role: "ADMIN" },
	{ username: "admin-tester", password: "pawtrip-admin-test", enabled: true, role: "ADMIN" },
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

db.exec("BEGIN");
try {
	for (const { username, password, enabled, role } of accounts) {
		const passwordHash = bcrypt.hashSync(password, 10);
		upsert.run(username, passwordHash, enabled ? 1 : 0, role);
		console.log(`Seeded ${username} (enabled=${enabled}, role=${role})`);
	}
	db.exec("COMMIT");
} catch (error) {
	db.exec("ROLLBACK");
	throw error;
} finally {
	db.close();
}

console.log(`Seeded ${accounts.length} account(s) into ${databasePath}`);
