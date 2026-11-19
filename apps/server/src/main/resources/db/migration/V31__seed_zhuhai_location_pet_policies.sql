-- 珠海地点宠物准入政策数据（V31），由 scripts/generate-location-policy-migration.mjs 生成；请勿手工编辑。
-- 来源：按版本重放 28 个 Flyway migration 得到的注入数据，行政区前缀 4404。
-- 仅覆盖 attraction/hotel/restaurant，跳过 test-zhu-* 及任一政策字段已有值的记录。
-- 更新 578 条，跳过已有政策 6 条：attraction 194/199，hotel 197/197，restaurant 187/188。

-- attraction 预设 1：开放式公园（48 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGCHFDX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OQE6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG8W3KQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIQ6JBA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHY5YKU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGXV0C9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGF3LB0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG1NLBW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF6YRCP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF07S0J' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OSSY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402LCI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401TRP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401HIB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F4005E8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OH6V' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJKCG0F' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH2MBF2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH0GD5Y' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40QAZ4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFEGEJM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG288LD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F4005E5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402KGI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402KG1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG7M57L' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OPGX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIUHZN5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHOD4A2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG2XS8R' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PGF6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIA8N7N' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGT0UQ1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFOPGMJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402VB5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI8WGBU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFTD2R2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGRCIPR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHDWKQ7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHDTKET' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OQO8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40RBIT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH40SB2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH1Z6M4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI3TJJD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PGFG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJAXMEP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 0, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF0F8D2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- attraction 预设 2：市政公园（49 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHB42AJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402TVO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGBAGLJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40QAQN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIOUGFP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHD00LW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGP84NJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG4ZA9I' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFSSQ3N' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF5TOY9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40QJW2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402ZN3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402B4Q' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401N5B' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401CVM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F400189' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402YTF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFPLI6T' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F4025JW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG23NCX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PS1J' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHWW8K4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402Z2E' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F4005D9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402BCN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH1W9JX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OH0V' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40037D' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFITGFTN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHKAIO3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFDG387' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402UZA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHO151V' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGDWK79' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40RBRU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402UU0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGPHUR9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJSNIL7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402ZAR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG1OHAW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PW3B' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401C03' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIF1J2H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI7QEMT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGQ07YL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI2NKGU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF2K8SL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40QULM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OGZ9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- attraction 预设 3：收费景区（49 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFIAHQYN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFHDNHDF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40PZC8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40Q3E9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFI8N1WB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFHCZ6ZU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFGG0HB1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFG31HZV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFFS8BOI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFF5EE31' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40Q5H7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F402LUN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40274C' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F401K22' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F401CJD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40ONEP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F4025J3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F4026XK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFIZSOHX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFFSTD8L' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFI59WW1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFHCL46P' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F402UY0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F4000E8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F4025K8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFIXMBX2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F402YHV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFJMRIBD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFIPM231' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFHEWT0R' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40Q9H0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F401IDD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFHI93ZI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFFXK3KX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40PMB9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F402UMZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFFFSAH5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFI9IWR1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40PW2Y' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F40PW2X' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F402YHD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B02F400AD1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFH23U6H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFI7HVD6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFFSFP5X' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFHA08SB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFF01NAW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFHRQZCB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 3000, reservation_required = 1
WHERE poi_id = 'B0FFJ2V27D' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- attraction 预设 4：山野景区（48 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OQYO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OJTR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PW2P' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401CLI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI2KCOY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGZN897' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGFP5OW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG1SQ1O' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFFUZX5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF5A5J1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PMC4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402LKW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F4026EZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401I0Y' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F400A2D' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F400693' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFT1BKP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PMB7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHDJKJ9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF6HIIJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFQ0AN1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGM2TTB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402OY1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PMBP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401F2A' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGBAH28' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PMC6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIWSV8E' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHUM9TO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG8TMWI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PMB8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJTHVKD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHFANNQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFQF2B8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402XN5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F400372' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGBAHRZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI79DHT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFR0SVA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401CU3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF59F0Y' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFGF7LV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF9VOLQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PMCK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402MB0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PMCB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402UE1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGK893M' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- hotel 预设 1：宠物友好（50 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFFUCLC2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFG5PSKG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0H1VUS1EF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0G0PHCLK4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0K6VMQCNI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFM13PBP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0K02SVF28' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFGLLAHZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0GUCC8IJN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFLPL30K' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFLFT9BT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFHQRUGR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F402QAO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F40QPLK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0JAL9D4KI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F402HMS' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F402W67' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFHYQ6S3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0JGKGPV7R' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0L0SSJ5U9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0I3NUC3F0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0M6J7FD5Z' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F402VRY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F402WYC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFGO524E' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFHCE7N0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F402N4L' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0J0BMQSXM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F402X65' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0L6NCK9LH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0G1OZF4G1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0KD41YDGJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0LKTCWH8T' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFFQ0BI0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFM3KG1R' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0KDOUP7T6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFH196T3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0HGNNJ7CL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFIS100Y' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0FFLJREYF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0H69HI6RF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0L1UL4G2E' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0GUX5ABAA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0LABZ4QNK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F40301C' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0H61UPZJL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0JR2N9WBM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F401G8O' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B02F401NE6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 0, reservation_required = 1
WHERE poi_id = 'B0M6TS2POS' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- hotel 预设 2：标准宠物房（49 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0I3SSWOVA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0IGF5VEAZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0KKPX7SPT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFAN064' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0G37S8WT5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0GR6KWNGM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFK7RM83' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFQ09TY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F401JXE' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F401IPM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0JRFLVAR6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFUYIIU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFHCF1PJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFHVSAS' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFA40QQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFG7XEWZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFQ0AOG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFG2GDW6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFSZFEI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0K62M6VXD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFH0HBGZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFV2SM5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGF2UNU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0L6ZRUK17' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F4029Q8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0JG1M94VO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0H26U147T' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0LRYHW75Y' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFI6F244' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFKWWG9S' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0KRJUBF9M' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0K2HSJMRX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0H391WTC6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0K64KJ3U8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0HGS95AMZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0K0ZHW80C' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFI1WSST' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0KRCZDQG1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGAOLY3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFJUZ72R' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGEGB4S' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40OIEY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0LB4DC8SC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0K6L5C68J' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0J3KHQGLC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFLJQHO7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0K1X55NCM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0L6TZW9G5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 45, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0KACCMN85' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- hotel 预设 3：高端宠物房（49 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0H3TSG03A' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0JGYRZ8H9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F402XH5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFKRA22R' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0J2O5K90D' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F4028Z7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFFP9DN9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0HUOKFON9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F40OLWH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFH0N3CS' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0KRKP4BH9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0IDUZQ35L' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFH436KH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F402N4N' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFHKBOZR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFK3MSCD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F40P7XG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0IBXHN18U' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0K3YCFYNW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0J2T53XFV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0KRC61TQR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0L04LZ0UF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0H33MUGBO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFKSFRKL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFHZVA0N' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0MUD5JIFD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0IK4MHXMC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0LBYMRV99' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0LK3R0OFA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F402HE4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0JAJ713XI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFG8Q0CB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0L15N08I7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0MB65NMI1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F401H36' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F40PWQ4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0IURSL6UT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0HB5UV5VC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F402PPG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0MBZSCIH4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B02F402QR4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0MDUC0GJO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0GKB6BIN3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0FFKWWR1K' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0LU2SV64V' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0LALLJD5V' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0G2G7O7OU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0K6CR0OZ6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 30, max_single_pet_shoulder_height_cm = 60, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 20000, reservation_required = 1
WHERE poi_id = 'B0L191HXR2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- hotel 预设 4：小型犬房（49 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F400HWI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFLCHY08' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F402WUV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F40Q7E0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F402X7G' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0KBRRP97E' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F400I9J' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0GRVCTBKX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFLITTBR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F40QFZH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F401FSD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F401ZQ0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFFRNF1H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0LKBYSM5H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0HAVG9VGN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFMFSGWD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFFFV1KQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F401DR4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0J2JZ2PDU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFHVNU2W' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFFV2NQG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0H6GL3B30' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F402B56' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0KDM9HSFX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0K3X74EXO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0KDZAQNFV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0I6974OKL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0G0K4R1UZ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0L3ASTDW4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFG2OXWF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F40PUCP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0K0XZAFTT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0MGRDK13X' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFG9TMNQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F400EEC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F401MZT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0H12U9PIC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0KG2MTYR6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFF42KLI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F40ONHQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B02F402YJW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFKSPA9I' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0LAO71H2X' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0J2F75VY2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0K1VUTTD2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFHSABVQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0FFM11IVE' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0MRAH008B' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 8, max_single_pet_shoulder_height_cm = 35, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 8000, reservation_required = 0
WHERE poi_id = 'B0J2TN4RLJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- restaurant 预设 1：宠物友好（62 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFK06GSE' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHDZTUD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401IZA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q2XS' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F4028MU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40R1JH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHW6UVK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGBK0ZU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q4P6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402LY3' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHHCGMD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q16H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJLVY7P' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI8QREX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG6NKR5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF6TX2Q' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PE4U' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402AFY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJ3QJDK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI919QA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI1V5ZU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHI1P33' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGWO79A' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG8VKJ9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFTEUA7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OHMO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402V48' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402TYN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F400EPD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHCSJLW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0LASSWFQM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF9VUHX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG6HE8S' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI2AUH8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF23VDL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJPTZZG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIQWCAP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIBB9ZP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH3AOTC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG9NIHN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFFPLNV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q4LU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OTFP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F4025VP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJCAM80' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIYF1WU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIGTTI1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHPQFVQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHD8W0A' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG81ZHC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFV87KA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q4FJ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402W1L' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHJQ5RN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGBI2II' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0JD47LIDU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0LULM6QV6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJIN7V2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402Z9E' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40ONCY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0LUGRECQI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'CAT,DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 15, max_single_pet_shoulder_height_cm = 40, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0I17SRJMA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- restaurant 预设 2：户外座位（63 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402A2S' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJF5E8Z' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG2CNDK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PHVY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OR5H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40289A' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIITO9I' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGXHYQ7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG3FNSX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PD5U' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402D8W' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFOFZZX' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402TJK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJ2C64F' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHC2HQF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFGXHI0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF4Q0AN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PDUR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJIXZ4N' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFIIP9Y4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFI8YOBB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHME2ZE' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHER2P6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGBLQ27' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG83RBL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40ONIC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402ZQW' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402U7P' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402TQQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401K9B' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0MRH7F3BA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0L09REEEK' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFY1EXQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402MGM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFGNHJT2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q1QT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40PDG7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFG124H2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40QX7B' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH0C7FB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFVI9AI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF9RJHY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q1RY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40OR5J' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F401CK5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFJ7N1K9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFITCY5C' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFICVDPV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHEN2TM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH2FP7R' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFW9OZ2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFSBLSU' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F40Q34E' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402V69' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFFP5GQM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFF2PCBE' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0MUZC7YIT' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0LKJL2UA2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFH8EZNG' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFHH7U76' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B02F402L65' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0FFLFPQ0Z' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 1, max_single_pet_weight_kg = 20, max_single_pet_shoulder_height_cm = 50, leash_required = 1, vaccination_proof_required = 0, extra_fee_cents = 0, reservation_required = 0
WHERE poi_id = 'B0G2Z7IVVA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

-- restaurant 预设 3：需预约（62 条）

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFJN5TOH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFHHWS8H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40PRU2' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFH9CMIC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F402UY1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFJDPNUH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFI9U2WM' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGKWCI5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFXMNON' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F402MEI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFI6RTPV' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFF52OER' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F402FR9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFIRCPQS' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGPBEYA' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFFSIL6' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40PHZ7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F402U7T' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFJFY8BH' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFIBMMYN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFI45I3D' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFHIO358' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFHBPRK4' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGALDC9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFWAK77' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40OJ2S' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F402WTO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F402U1B' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F401FLP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFV1V68' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0MDKABTR1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFQ0ACL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F401FXN' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F400GCR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFQ0B20' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40PDL0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGK05II' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFJI31ET' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFH9QYLF' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFH05IRY' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFV6SF8' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40QFWL' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40PEC5' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F402D8F' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFHMQPGO' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFJ09WQP' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFISAPGR' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFI96K50' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFHE3KH7' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGBAIC9' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFVSJTI' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFQ0C8L' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40PIBD' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F401B6K' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFIIMWKQ' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F40Q7KC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0MRVLE19H' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0L3JHDTKC' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFGBAICB' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0FFFEVCN0' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B02F401AD1' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

UPDATE pawtrip_location
SET allowed_pet_types = 'DOG', max_pets_per_person = 2, max_single_pet_weight_kg = 25, max_single_pet_shoulder_height_cm = 55, leash_required = 1, vaccination_proof_required = 1, extra_fee_cents = 5000, reservation_required = 1
WHERE poi_id = 'B0LK7L3U21' AND allowed_pet_types IS NULL AND max_pets_per_person IS NULL AND max_single_pet_weight_kg IS NULL AND max_single_pet_shoulder_height_cm IS NULL AND leash_required IS NULL AND vaccination_proof_required IS NULL AND extra_fee_cents IS NULL AND reservation_required IS NULL;

