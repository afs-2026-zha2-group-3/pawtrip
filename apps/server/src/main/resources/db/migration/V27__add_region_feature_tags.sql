-- 城市特征标签（REQ-014 城市个性化推荐）：只读种子层，无管理端写入口。
-- 特征键：COASTAL 海滨、MOUNTAIN 山地、LAKE 湖泊、GRASSLAND 草原、CITY_PARK 城市公园、SNOW 雪景。
-- 48 个知名旅游城市（清单见 REQ-014 附录 A，adcode 已逐一核对 V5 city 级）；其余城市保持 NULL（得分 0）。
ALTER TABLE administrative_region
    ADD COLUMN feature_tags TEXT;

-- 海滨为主（15 城）
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '440400'; -- 珠海市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '460200'; -- 三亚市
UPDATE administrative_region SET feature_tags = 'COASTAL,MOUNTAIN' WHERE adcode = '370200'; -- 青岛市
UPDATE administrative_region SET feature_tags = 'COASTAL,CITY_PARK' WHERE adcode = '350200'; -- 厦门市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '210200'; -- 大连市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '460100'; -- 海口市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '450500'; -- 北海市
UPDATE administrative_region SET feature_tags = 'COASTAL,CITY_PARK' WHERE adcode = '440300'; -- 深圳市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '330200'; -- 宁波市
UPDATE administrative_region SET feature_tags = 'COASTAL,MOUNTAIN' WHERE adcode = '330300'; -- 温州市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '350500'; -- 泉州市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '370600'; -- 烟台市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '371000'; -- 威海市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '130300'; -- 秦皇岛市
UPDATE administrative_region SET feature_tags = 'COASTAL' WHERE adcode = '330900'; -- 舟山市

-- 山地为主（12 城）
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,LAKE' WHERE adcode = '450300'; -- 桂林市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,SNOW' WHERE adcode = '530700'; -- 丽江市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN' WHERE adcode = '430800'; -- 张家界市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN' WHERE adcode = '341000'; -- 黄山市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN' WHERE adcode = '370900'; -- 泰安市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN' WHERE adcode = '511100'; -- 乐山市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,GRASSLAND' WHERE adcode = '130800'; -- 承德市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,SNOW' WHERE adcode = '130700'; -- 张家口市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,CITY_PARK' WHERE adcode = '510100'; -- 成都市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,CITY_PARK' WHERE adcode = '320100'; -- 南京市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,CITY_PARK' WHERE adcode = '350100'; -- 福州市
UPDATE administrative_region SET feature_tags = 'MOUNTAIN,CITY_PARK' WHERE adcode = '430100'; -- 长沙市

-- 湖泊为主（8 城）
UPDATE administrative_region SET feature_tags = 'LAKE,CITY_PARK' WHERE adcode = '330100'; -- 杭州市
UPDATE administrative_region SET feature_tags = 'LAKE,CITY_PARK' WHERE adcode = '320500'; -- 苏州市
UPDATE administrative_region SET feature_tags = 'LAKE' WHERE adcode = '320200'; -- 无锡市
UPDATE administrative_region SET feature_tags = 'LAKE,CITY_PARK' WHERE adcode = '420100'; -- 武汉市
UPDATE administrative_region SET feature_tags = 'LAKE,CITY_PARK' WHERE adcode = '530100'; -- 昆明市
UPDATE administrative_region SET feature_tags = 'LAKE,MOUNTAIN' WHERE adcode = '532900'; -- 大理白族自治州
UPDATE administrative_region SET feature_tags = 'LAKE,GRASSLAND' WHERE adcode = '630100'; -- 西宁市
UPDATE administrative_region SET feature_tags = 'LAKE,GRASSLAND' WHERE adcode = '640100'; -- 银川市

-- 草原为主（6 城）
UPDATE administrative_region SET feature_tags = 'GRASSLAND,SNOW' WHERE adcode = '150700'; -- 呼伦贝尔市
UPDATE administrative_region SET feature_tags = 'GRASSLAND' WHERE adcode = '150100'; -- 呼和浩特市
UPDATE administrative_region SET feature_tags = 'GRASSLAND' WHERE adcode = '152500'; -- 锡林郭勒盟
UPDATE administrative_region SET feature_tags = 'GRASSLAND,MOUNTAIN,SNOW' WHERE adcode = '650100'; -- 乌鲁木齐市
UPDATE administrative_region SET feature_tags = 'GRASSLAND,SNOW,MOUNTAIN' WHERE adcode = '654300'; -- 阿勒泰地区
UPDATE administrative_region SET feature_tags = 'GRASSLAND,MOUNTAIN' WHERE adcode = '654000'; -- 伊犁哈萨克自治州

-- 雪景为主（5 城）
UPDATE administrative_region SET feature_tags = 'SNOW,CITY_PARK' WHERE adcode = '230100'; -- 哈尔滨市
UPDATE administrative_region SET feature_tags = 'SNOW' WHERE adcode = '220100'; -- 长春市
UPDATE administrative_region SET feature_tags = 'SNOW,CITY_PARK' WHERE adcode = '210100'; -- 沈阳市
UPDATE administrative_region SET feature_tags = 'SNOW,MOUNTAIN' WHERE adcode = '540100'; -- 拉萨市
UPDATE administrative_region SET feature_tags = 'SNOW,MOUNTAIN' WHERE adcode = '533400'; -- 迪庆藏族自治州

-- 城市公园（2 城）
UPDATE administrative_region SET feature_tags = 'CITY_PARK' WHERE adcode = '440100'; -- 广州市
UPDATE administrative_region SET feature_tags = 'CITY_PARK' WHERE adcode = '610100'; -- 西安市