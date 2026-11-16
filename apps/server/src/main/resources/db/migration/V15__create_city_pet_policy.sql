CREATE TABLE city_pet_policy (
    adcode TEXT PRIMARY KEY,
    area_scope TEXT,
    policies_json TEXT NOT NULL,
    source_title TEXT NOT NULL,
    source_note TEXT,
    updated_month TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (updated_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
    FOREIGN KEY (adcode) REFERENCES administrative_region(adcode)
);

CREATE TABLE city_banned_dog_breed (
    adcode TEXT NOT NULL,
    dog_breed_id INTEGER NOT NULL,
    PRIMARY KEY (adcode, dog_breed_id),
    FOREIGN KEY (adcode) REFERENCES city_pet_policy(adcode) ON DELETE CASCADE,
    FOREIGN KEY (dog_breed_id) REFERENCES dog_breed(id) ON DELETE CASCADE
);

CREATE INDEX idx_city_banned_dog_breed_breed
    ON city_banned_dog_breed(dog_breed_id);

INSERT INTO city_pet_policy (
    adcode,
    area_scope,
    policies_json,
    source_title,
    source_note,
    updated_month
) VALUES (
    '440400',
    '严格管理区',
    '["严格管理区内禁止饲养危险犬。","危险犬的具体标准由市公安机关会同市农业农村行政管理部门确定，并向社会公布。","禁止携带未在本市登记的危险犬进入本市。","危险犬包括攻击性强的烈性犬只、有烈性犬血统的混种犬只和体型特别巨大的犬只；体高（肩高）超过 71 厘米的成年犬只也属于危险犬。"]',
    '《关于珠海市严格管理区内禁止饲养的危险犬标准及品种的通告》',
    '内容整理自珠海市人民政府公开发布的通告；具体执行口径以当地主管部门解释为准。',
    '2025-07'
);

-- 珠海通告 38 种危险犬中，可在宠物档案中选择的犬种对照：
-- 比特斗牛梗犬→比特犬、西藏獒犬→藏獒、俄罗斯高加索犬→高加索犬、意大利卡斯罗犬→卡斯罗犬；
-- 德国牧羊犬、罗威纳犬、杜宾犬、秋田犬同名。其余品种不在可选词表内，不参与判定。
INSERT INTO city_banned_dog_breed (adcode, dog_breed_id)
SELECT '440400', id
FROM dog_breed
WHERE name IN (
    '比特犬',
    '藏獒',
    '德国牧羊犬',
    '罗威纳犬',
    '杜宾犬',
    '秋田犬',
    '高加索犬',
    '卡斯罗犬'
);
