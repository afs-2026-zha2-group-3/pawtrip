package com.pawtrip.server.application.model.maps;

import java.math.BigDecimal;

/** 上游原始估算结果：taxiCostYuan 仅驾车返回（步行为 null），durationSeconds 为路线耗时秒。 */
public record RouteEstimateResult(BigDecimal taxiCostYuan, long durationSeconds) {}