CREATE TABLE administrative_region (
    adcode TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    citycode TEXT,
    level TEXT NOT NULL CHECK (level IN ('province', 'city')),
    parent_adcode TEXT,
    CHECK (
        (level = 'province' AND parent_adcode IS NULL)
        OR (level = 'city' AND parent_adcode IS NOT NULL)
    ),
    FOREIGN KEY (parent_adcode) REFERENCES administrative_region(adcode)
);

CREATE INDEX idx_administrative_region_parent
    ON administrative_region(parent_adcode);

CREATE TABLE pawtrip_location (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poi_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type_code TEXT NOT NULL,
    type_group TEXT NOT NULL,
    address TEXT,
    longitude REAL,
    latitude REAL,
    region_code TEXT,
    poi_json TEXT NOT NULL,
    business_json TEXT NOT NULL DEFAULT '{}',
    min_visit_hours INTEGER CHECK (min_visit_hours IS NULL OR min_visit_hours >= 0),
    max_visit_hours INTEGER CHECK (max_visit_hours IS NULL OR max_visit_hours >= 0),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (
        min_visit_hours IS NULL
        OR max_visit_hours IS NULL
        OR min_visit_hours <= max_visit_hours
    )
);

CREATE INDEX idx_pawtrip_location_region_type_id
    ON pawtrip_location(region_code, type_group, id);

CREATE TABLE location_photo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_id INTEGER NOT NULL,
    photo_order INTEGER NOT NULL CHECK (photo_order >= 0),
    source_json TEXT NOT NULL,
    title TEXT,
    source_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SAVED', 'FAILED')),
    media_type TEXT,
    content BLOB,
    error_code TEXT,
    UNIQUE (location_id, photo_order),
    FOREIGN KEY (location_id) REFERENCES pawtrip_location(id) ON DELETE CASCADE
);

CREATE INDEX idx_location_photo_location
    ON location_photo(location_id);
