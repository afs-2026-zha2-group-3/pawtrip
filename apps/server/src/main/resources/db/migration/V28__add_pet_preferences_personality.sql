-- 宠物喜好（多选，逗号分隔键）与性格（单选键）；历史宠物保持为空（未设置）。
-- 词表：preferences ∈ SWIMMING/HIKING/GRASS_RUNNING/CITY_WALKING/SNOW_PLAY；
--       personality ∈ ENERGETIC/CALM/TIMID。枚举合法性由服务端校验（REQ-014）。
ALTER TABLE pet
    ADD COLUMN preferences TEXT;

ALTER TABLE pet
    ADD COLUMN personality TEXT;