CREATE TABLE pet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    pet_type TEXT NOT NULL CHECK (pet_type IN ('CAT', 'DOG')),
    weight_kg REAL NOT NULL CHECK (weight_kg > 0),
    has_leash INTEGER NOT NULL CHECK (has_leash IN (0, 1)),
    has_vaccination_proof INTEGER NOT NULL CHECK (has_vaccination_proof IN (0, 1)),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE INDEX idx_pet_user
    ON pet(user_id);
