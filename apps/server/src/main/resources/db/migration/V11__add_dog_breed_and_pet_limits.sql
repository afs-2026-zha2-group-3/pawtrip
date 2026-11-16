-- 狗品种参考表；name 为中文名称，official_aggressive 表示是否为官方烈性犬。
CREATE TABLE dog_breed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
    official_aggressive INTEGER NOT NULL CHECK (official_aggressive IN (0, 1))
);

-- 城市允许的狗品种；通过外键保证品种与 dog_breed 一致，同一城市可保存多个品种。
CREATE TABLE city_allowed_dog_breed (
    adcode TEXT NOT NULL,
    dog_breed_id INTEGER NOT NULL,
    PRIMARY KEY (adcode, dog_breed_id),
    FOREIGN KEY (adcode) REFERENCES administrative_region(adcode) ON DELETE CASCADE,
    FOREIGN KEY (dog_breed_id) REFERENCES dog_breed(id) ON DELETE CASCADE
);

CREATE INDEX idx_city_allowed_dog_breed_breed
    ON city_allowed_dog_breed(dog_breed_id);

ALTER TABLE pawtrip_location
    ADD COLUMN max_single_pet_shoulder_height_cm REAL
    CHECK (max_single_pet_shoulder_height_cm IS NULL OR max_single_pet_shoulder_height_cm >= 0);

ALTER TABLE administrative_region
    ADD COLUMN max_single_pet_shoulder_height_cm REAL
    CHECK (max_single_pet_shoulder_height_cm IS NULL OR max_single_pet_shoulder_height_cm >= 0);
