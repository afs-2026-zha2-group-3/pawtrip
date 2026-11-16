ALTER TABLE administrative_region
    ADD COLUMN max_pets_per_person INTEGER
    CHECK (max_pets_per_person IS NULL OR max_pets_per_person >= 0);

ALTER TABLE administrative_region
    ADD COLUMN max_single_pet_weight_kg REAL
    CHECK (max_single_pet_weight_kg IS NULL OR max_single_pet_weight_kg >= 0);

ALTER TABLE administrative_region
    ADD COLUMN leash_required INTEGER
    CHECK (leash_required IS NULL OR leash_required IN (0, 1));

ALTER TABLE administrative_region
    ADD COLUMN vaccination_proof_required INTEGER
    CHECK (vaccination_proof_required IS NULL OR vaccination_proof_required IN (0, 1));

ALTER TABLE administrative_region
    ADD COLUMN extra_fee_cents INTEGER
    CHECK (extra_fee_cents IS NULL OR extra_fee_cents >= 0);

ALTER TABLE administrative_region
    ADD COLUMN reservation_required INTEGER
    CHECK (reservation_required IS NULL OR reservation_required IN (0, 1));

ALTER TABLE pawtrip_location
    ADD COLUMN max_pets_per_person INTEGER
    CHECK (max_pets_per_person IS NULL OR max_pets_per_person >= 0);

ALTER TABLE pawtrip_location
    ADD COLUMN max_single_pet_weight_kg REAL
    CHECK (max_single_pet_weight_kg IS NULL OR max_single_pet_weight_kg >= 0);

ALTER TABLE pawtrip_location
    ADD COLUMN leash_required INTEGER
    CHECK (leash_required IS NULL OR leash_required IN (0, 1));

ALTER TABLE pawtrip_location
    ADD COLUMN vaccination_proof_required INTEGER
    CHECK (vaccination_proof_required IS NULL OR vaccination_proof_required IN (0, 1));

ALTER TABLE pawtrip_location
    ADD COLUMN extra_fee_cents INTEGER
    CHECK (extra_fee_cents IS NULL OR extra_fee_cents >= 0);

ALTER TABLE pawtrip_location
    ADD COLUMN reservation_required INTEGER
    CHECK (reservation_required IS NULL OR reservation_required IN (0, 1));
