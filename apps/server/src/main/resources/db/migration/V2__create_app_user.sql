-- Accounts are not seeded by migrations; run scripts/seed-users.mjs for local/test data.
CREATE TABLE app_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1
);
