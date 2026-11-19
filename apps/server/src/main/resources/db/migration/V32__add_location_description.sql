-- 地点简介：供用户端地点卡片、详情弹窗与地图详情卡展示。
-- 未配置简介的历史地点保留 NULL，前端回退展示地址。

ALTER TABLE pawtrip_location ADD COLUMN description TEXT;

UPDATE pawtrip_location
SET description = '沿着林间小径慢慢走，和毛孩子一起享受山海绿意。'
WHERE poi_id = 'B02F400HUL';

UPDATE pawtrip_location
SET description = '沿着海岸线散步，和毛孩子一起吹海风、看日落。'
WHERE poi_id = 'B0FFFPX66R';

UPDATE pawtrip_location
SET description = '山间步道平缓，适合和毛孩子一起慢慢爬山吸氧。'
WHERE poi_id = 'B02F402OXV';

UPDATE pawtrip_location
SET description = '古树成荫的城市公园，遛狗散步都很舒服。'
WHERE poi_id = 'B02F401ZUE';

UPDATE pawtrip_location
SET description = '海岛上的开阔广场，适合带毛孩子吹海风、看海景。'
WHERE poi_id = 'B0FFGZN897';

UPDATE pawtrip_location
SET description = '沿河而建的生态公园，傍晚散步很惬意。'
WHERE poi_id = 'B0FFGXV0C9';

UPDATE pawtrip_location
SET description = '青砖老街与海风相伴，适合和毛孩子慢慢逛。'
WHERE poi_id = 'B0FFHCZ6ZU';

UPDATE pawtrip_location
SET description = '乘索道上山俯瞰海岸线，和毛孩子一起看山海风光。'
WHERE poi_id = 'B0FFHD00LW';

UPDATE pawtrip_location
SET description = '面朝情侣路的海景酒店，允许携带中小型犬入住。'
WHERE poi_id = 'test-zhu-hotel-1';

UPDATE pawtrip_location
SET description = '情侣路上的宠物友好民宿，步行即可到海边散步。'
WHERE poi_id = 'test-zhu-hotel-2';

UPDATE pawtrip_location
SET description = '海湾度假酒店，宠物可在公共区域活动。'
WHERE poi_id = 'test-zhu-hotel-3';

UPDATE pawtrip_location
SET description = '紧邻海岸公园的宠物酒店，遛狗出门就是海景。'
WHERE poi_id = 'test-zhu-hotel-4';

UPDATE pawtrip_location
SET description = '情侣路旁的小型海滨民宿，安静适合带宠休息。'
WHERE poi_id = 'test-zhu-hotel-5';

UPDATE pawtrip_location
SET description = '金湾的宠物度假酒店，带独立活动空间。'
WHERE poi_id = 'test-zhu-hotel-6';

UPDATE pawtrip_location
SET description = '香炉湾附近的普通酒店，携宠入住需提前咨询。'
WHERE poi_id = 'test-zhu-hotel-7';

UPDATE pawtrip_location
SET description = '香炉湾的宠物友好餐厅，户外座位可以带毛孩子一起用餐。'
WHERE poi_id = 'test-zhu-restaurant-1';

UPDATE pawtrip_location
SET description = '情侣路的海景餐厅，露台座位欢迎携宠就餐。'
WHERE poi_id = 'test-zhu-restaurant-2';

UPDATE pawtrip_location
SET description = '海岸公园旁的宠物餐厅，散步后正好补充能量。'
WHERE poi_id = 'test-zhu-restaurant-3';

UPDATE pawtrip_location
SET description = '金湾的宠物友好餐厅，户外区域宽敞。'
WHERE poi_id = 'test-zhu-restaurant-4';

UPDATE pawtrip_location
SET description = '香炉湾的普通餐厅，携宠就餐请提前确认座位。'
WHERE poi_id = 'test-zhu-restaurant-5';
