-- 修正 V20 珠海测试酒店/餐厅的名称、地址与经纬度，改用珠海真实 POI 的坐标，避免地图标记落在海上。
-- 保留 test-zhu-* 的 poi_id，已加入行程的引用不受影响。

UPDATE pawtrip_location
SET name = '珠海情侣中路安颐滨海酒店(日月贝店)',
    address = '东风路45号豪园大厦1层5号',
    longitude = 113.57958,
    latitude = 22.27195,
    region_code = '440402',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-hotel-1';

UPDATE pawtrip_location
SET name = '里白酒店(珠海日月贝扬名广场店)',
    address = '凤凰南路1038号海城大厦三楼',
    longitude = 113.579278,
    latitude = 22.273287,
    region_code = '440402',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-hotel-2';

UPDATE pawtrip_location
SET name = '珠海情侣路日月贝新天地亚朵酒店大堂',
    address = '珠海市香洲区海燕路20号',
    longitude = 113.580301,
    latitude = 22.274979,
    region_code = '440402',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-hotel-3';

UPDATE pawtrip_location
SET name = '尚客优快捷酒店(珠海高新区大学城店)',
    address = '山房路北侧唐家商业广场B栋2楼3-34号商铺',
    longitude = 113.59735,
    latitude = 22.356494,
    region_code = '440402',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-hotel-4';

UPDATE pawtrip_location
SET name = '安颐宜居公寓(珠海唐家湾中山大学店)',
    address = '唐中路与山房路交叉口东北100米',
    longitude = 113.596578,
    latitude = 22.358216,
    region_code = '440402'
WHERE poi_id = 'test-zhu-hotel-5';

UPDATE pawtrip_location
SET name = '珠海涛景假日酒店(金湾国际机场店)',
    address = '海澄正表村二巷22号',
    longitude = 113.379445,
    latitude = 22.015411,
    region_code = '440404',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-hotel-6';

UPDATE pawtrip_location
SET name = '丽舍酒店',
    address = '康宁路70号',
    longitude = 113.578334,
    latitude = 22.274545,
    region_code = '440402'
WHERE poi_id = 'test-zhu-hotel-7';

UPDATE pawtrip_location
SET name = '新骏景万豪酒店·大堂吧',
    address = '景山路177号9栋(新骏景万豪酒店一层)',
    longitude = 113.576498,
    latitude = 22.256692,
    region_code = '440402',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-restaurant-1';

UPDATE pawtrip_location
SET name = '春兴海鲜酒家·四十二年老字号(吉大店)',
    address = '吉大园林路33-39号',
    longitude = 113.582065,
    latitude = 22.251821,
    region_code = '440402',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-restaurant-2';

UPDATE pawtrip_location
SET name = '丰味小厨(唐家店)',
    address = '唐家湾镇唐人街6栋121室',
    longitude = 113.599725,
    latitude = 22.360475,
    region_code = '440402',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-restaurant-3';

UPDATE pawtrip_location
SET name = '翠花东北菜饺子馆(红旗店)',
    address = '红旗镇广安路137号中珠花园8栋1单元',
    longitude = 113.349422,
    latitude = 22.136435,
    region_code = '440404',
    allowed_pet_types = 'CAT,DOG'
WHERE poi_id = 'test-zhu-restaurant-4';

UPDATE pawtrip_location
SET name = '乐乐法式甜点(香洲店)',
    address = '胡湾里四街77号',
    longitude = 113.570671,
    latitude = 22.268625,
    region_code = '440402'
WHERE poi_id = 'test-zhu-restaurant-5';
