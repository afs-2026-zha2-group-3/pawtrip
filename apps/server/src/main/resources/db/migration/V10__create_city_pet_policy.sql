CREATE TABLE city_pet_policy (
    adcode TEXT PRIMARY KEY,
    area_scope TEXT,
    policies_json TEXT NOT NULL,
    banned_breeds TEXT NOT NULL,
    source_title TEXT NOT NULL,
    source_note TEXT,
    updated_month TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    CHECK (updated_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]'),
    FOREIGN KEY (adcode) REFERENCES administrative_region(adcode)
);

INSERT INTO city_pet_policy (
    adcode,
    area_scope,
    policies_json,
    banned_breeds,
    source_title,
    source_note,
    updated_month
) VALUES (
    '440400',
    '严格管理区',
    '["严格管理区内禁止饲养危险犬。","危险犬的具体标准由市公安机关会同市农业农村行政管理部门确定，并向社会公布。","禁止携带未在本市登记的危险犬进入本市。","危险犬包括攻击性强的烈性犬只、有烈性犬血统的混种犬只和体型特别巨大的犬只；体高（肩高）超过 71 厘米的成年犬只也属于危险犬。"]',
    '["比特斗牛梗犬","斯塔福梗犬","阿根廷杜高犬","巴西非拉犬","日本土佐犬","意大利卡斯罗犬","中亚牧羊犬","俄罗斯高加索犬","西藏獒犬","意大利扭玻利顿犬","法国波尔多犬","牛头獒犬","罗威纳犬","杜宾犬","英国马士提夫犬","德国拳师犬","秋田犬","比利时牧羊犬","荷兰牧羊犬","德国牧羊犬","法国狼犬","捷克猎狼犬","川东犬","佛兰德斯牡牛犬","牛头梗犬","纽芬兰犬","爱尔兰猎狼犬","阿富汗猎犬","威玛猎犬","比利时马林诺斯犬","苏俄牧羊犬","安纳托利亚牧羊犬","圣伯纳犬","大白熊犬","大丹犬","波音达犬","斗牛犬","凯丽蓝梗犬"]',
    '《关于珠海市严格管理区内禁止饲养的危险犬标准及品种的通告》',
    '按公开汇总整理的 2025 调整后版本；品种名称以公告原文为准，发布前需人工复核。',
    '2025-07'
);
