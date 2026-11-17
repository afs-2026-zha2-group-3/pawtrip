CREATE TABLE trip (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    name        TEXT    NOT NULL,
    city_adcode TEXT    NOT NULL,
    pet_id      INTEGER NOT NULL,
    total_days  INTEGER NOT NULL CHECK (total_days >= 1),
    plan_json   TEXT    NOT NULL DEFAULT '{"version":1,"days":[],"unscheduled":[]}',
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (user_id) REFERENCES app_user(id) ON DELETE CASCADE,
    FOREIGN KEY (city_adcode) REFERENCES administrative_region(adcode),
    FOREIGN KEY (pet_id) REFERENCES pet(id) ON DELETE RESTRICT
);

CREATE INDEX idx_trip_user_id ON trip(user_id, id);
