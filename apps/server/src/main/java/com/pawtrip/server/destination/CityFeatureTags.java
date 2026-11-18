package com.pawtrip.server.destination;

import java.util.Set;

/**
 * 城市特征键词表（REQ-014，design D1）：只读下发，不做写入校验。
 * 海滨 COASTAL、山地 MOUNTAIN、湖泊 LAKE、草原 GRASSLAND、城市公园 CITY_PARK、雪景 SNOW。
 * 数据由 V27 种子维护（48 城，见 REQ-014 附录 A）；未标注城市 feature_tags 为 NULL。
 */
public final class CityFeatureTags {

	public static final Set<String> KEYS = Set.of(
			"COASTAL", "MOUNTAIN", "LAKE", "GRASSLAND", "CITY_PARK", "SNOW");

	private CityFeatureTags() {
	}

}