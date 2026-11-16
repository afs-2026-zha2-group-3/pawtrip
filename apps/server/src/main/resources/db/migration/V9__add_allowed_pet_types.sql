-- NULL 表示未配置；值按固定顺序保存，'CAT,DOG' 表示猫和狗都允许。
ALTER TABLE administrative_region
    ADD COLUMN allowed_pet_types TEXT
    CHECK (allowed_pet_types IS NULL OR allowed_pet_types IN ('CAT', 'DOG', 'CAT,DOG'));

ALTER TABLE pawtrip_location
    ADD COLUMN allowed_pet_types TEXT
    CHECK (allowed_pet_types IS NULL OR allowed_pet_types IN ('CAT', 'DOG', 'CAT,DOG'));
