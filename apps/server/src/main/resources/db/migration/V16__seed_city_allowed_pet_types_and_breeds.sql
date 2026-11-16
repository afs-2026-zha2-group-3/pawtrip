-- 全部城市级行政区宠物友好种子数据（2026-11-16 需求方指定，change destination-selection 任务 7.6）。
-- 版本号避让在途 PR #43 的 V15（city_pet_policy）；allowed_pet_types 口径见 V9。
UPDATE administrative_region
SET allowed_pet_types = 'CAT,DOG'
WHERE level = 'city';

-- 允许品种取非烈性常见犬种（official_aggressive=0，词表与 dog_breed 参考表一致）
INSERT OR IGNORE INTO city_allowed_dog_breed (adcode, dog_breed_id)
SELECT r.adcode, b.id
FROM administrative_region r
CROSS JOIN dog_breed b
WHERE r.level = 'city'
  AND b.name IN ('柯基犬', '贵宾犬', '金毛寻回犬', '拉布拉多寻回犬', '比熊犬', '博美犬', '哈士奇');