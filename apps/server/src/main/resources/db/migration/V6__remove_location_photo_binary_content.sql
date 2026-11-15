CREATE TABLE location_photo_without_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    photo_order INTEGER NOT NULL CHECK (photo_order >= 0),
    source_json TEXT NOT NULL,
    title TEXT,
    source_url TEXT NOT NULL,
    UNIQUE (location_id, photo_order),
    FOREIGN KEY (location_id) REFERENCES pawtrip_location(id) ON DELETE CASCADE
);

INSERT INTO location_photo_without_content (
    id,
    location_id,
    photo_order,
    source_json,
    title,
    source_url
)
SELECT
    id,
    location_id,
    photo_order,
    source_json,
    title,
    source_url
FROM location_photo;

DROP TABLE location_photo;
ALTER TABLE location_photo_without_content RENAME TO location_photo;

CREATE INDEX idx_location_photo_location
    ON location_photo(location_id);
