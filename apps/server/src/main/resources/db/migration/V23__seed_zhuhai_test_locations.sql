-- 珠海测试地点：酒店/餐厅，含经纬度与宠物政策；用于本地/演示验证“离景点最近”5km 筛选。
-- 已存在的 poi_id 保留原记录；不覆盖后台编辑结果。

INSERT INTO pawtrip_location (
    poi_id, name, type_code, type_group, address, longitude, latitude, region_code,
    poi_json, business_json, min_visit_hours, max_visit_hours, allowed_pet_types,
    max_pets_per_person, max_single_pet_weight_kg, max_single_pet_shoulder_height_cm,
    leash_required, vaccination_proof_required, extra_fee_cents, reservation_required
) VALUES
    ('test-zhu-hotel-1', '海湾·宠物友好酒店', '100000', 'hotel', '珠海市香洲区情侣路', 113.5850, 22.2670, '440402',
     '{}', '{}', NULL, NULL, 'DOG', 1, 15.0, 45.0, 1, 0, 30000, 0),
    ('test-zhu-hotel-2', '情侣路·海景民宿', '100000', 'hotel', '珠海市香洲区情侣路', 113.5900, 22.2700, '440402',
     '{}', '{}', NULL, NULL, 'DOG', 1, 10.0, 35.0, 1, 1, 5000, 0),
    ('test-zhu-hotel-3', '海湾度假大酒店', '100000', 'hotel', '珠海市香洲区情侣路', 113.5750, 22.2600, '440402',
     '{}', '{}', NULL, NULL, 'CAT,DOG', 2, 25.0, NULL, 1, 0, 12000, 1),
    ('test-zhu-hotel-4', '海岸公园·宠物酒店', '100000', 'hotel', '珠海市香洲区海岸公园', 113.6200, 22.3490, '440402',
     '{}', '{}', NULL, NULL, 'DOG', 1, 20.0, 50.0, 1, 0, 0, 0),
    ('test-zhu-hotel-5', '情侣路·海滨民宿', '100000', 'hotel', '珠海市香洲区情侣路', 113.6150, 22.3400, '440402',
     '{}', '{}', NULL, NULL, 'DOG', 1, 8.0, 30.0, 1, 1, 8000, 0),
    ('test-zhu-hotel-6', '金湾·宠物度假酒店', '100000', 'hotel', '珠海市金湾区', 113.4000, 22.1000, '440404',
     '{}', '{}', NULL, NULL, 'DOG', 2, 30.0, NULL, 1, 0, 20000, 1),
    ('test-zhu-hotel-7', '香炉湾·普通酒店', '100000', 'hotel', '珠海市香洲区香炉湾', 113.5820, 22.2640, '440402',
     '{}', '{}', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
    ('test-zhu-restaurant-1', '香炉湾·宠物友好餐厅', '050000', 'restaurant', '珠海市香洲区香炉湾', 113.5840, 22.2660, '440402',
     '{}', '{}', NULL, NULL, 'DOG', 1, 15.0, NULL, 1, 0, 0, 0),
    ('test-zhu-restaurant-2', '情侣路·海景餐厅', '050000', 'restaurant', '珠海市香洲区情侣路', 113.5900, 22.2700, '440402',
     '{}', '{}', NULL, NULL, 'DOG', 1, 10.0, NULL, 1, 0, 5000, 1),
    ('test-zhu-restaurant-3', '海岸公园·宠物餐厅', '050000', 'restaurant', '珠海市香洲区海岸公园', 113.6200, 22.3490, '440402',
     '{}', '{}', NULL, NULL, 'CAT,DOG', 2, 20.0, NULL, 1, 0, 0, 0),
    ('test-zhu-restaurant-4', '金湾·宠物餐厅', '050000', 'restaurant', '珠海市金湾区', 113.4000, 22.1000, '440404',
     '{}', '{}', NULL, NULL, 'DOG', 1, 15.0, NULL, 1, 0, 0, 0),
    ('test-zhu-restaurant-5', '香炉湾·普通餐厅', '050000', 'restaurant', '珠海市香洲区香炉湾', 113.5830, 22.2640, '440402',
     '{}', '{}', NULL, NULL, NULL, 0, NULL, NULL, 1, 0, NULL, NULL)
ON CONFLICT(poi_id) DO NOTHING;
