package com.pawtrip.server.infrastructure.amap.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "amap")
public record AmapProperties(
		String apiKey, String baseUrl, Duration connectTimeout, Duration readTimeout) {}
