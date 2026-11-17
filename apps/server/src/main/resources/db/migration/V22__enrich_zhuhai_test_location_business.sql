-- 为 V20/V21 珠海测试地点补充真实 POI 的 poi_json/business_json，使地图详情卡片能展示照片、评分与商圈。
-- 仅更新 test-zhu-* 测试记录，匹配同名真实 POI；找不到同名记录时保留原 JSON。

UPDATE pawtrip_location AS test
SET poi_json = (
        SELECT real.poi_json
        FROM pawtrip_location AS real
        WHERE real.name = test.name
          AND real.poi_id NOT LIKE 'test-zhu-%'
        LIMIT 1
    ),
    business_json = (
        SELECT real.business_json
        FROM pawtrip_location AS real
        WHERE real.name = test.name
          AND real.poi_id NOT LIKE 'test-zhu-%'
        LIMIT 1
    )
WHERE test.poi_id LIKE 'test-zhu-%'
  AND EXISTS (
      SELECT 1
      FROM pawtrip_location AS real
      WHERE real.name = test.name
        AND real.poi_id NOT LIKE 'test-zhu-%'
  );
