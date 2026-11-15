package com.pawtrip.server.infrastructure.amap.transport;

import com.pawtrip.server.infrastructure.amap.config.AmapProperties;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import tools.jackson.databind.JsonNode;

@Component
public class AmapTransport {

	private static final Logger logger = LoggerFactory.getLogger(AmapTransport.class);

	private final RestClient restClient;
	private final AmapProperties properties;

	public AmapTransport(RestClient amapRestClient, AmapProperties properties) {
		this.restClient = amapRestClient;
		this.properties = properties;
	}

	public JsonNode getJson(String path, Map<String, String> parameters) {
		String apiKey = properties.apiKey();
		if (apiKey == null || apiKey.isBlank()) {
			throw new AmapTransportException(AmapTransportException.Code.MISSING_API_KEY);
		}

		try {
			JsonNode response =
					restClient
							.get()
							.uri(
									uriBuilder -> {
										var requestUri = uriBuilder.path(path);
										parameters.forEach(
												(name, value) -> requestUri.queryParam(name, value));
										return requestUri.queryParam("key", apiKey).queryParam("output", "json").build();
									})
							.accept(MediaType.APPLICATION_JSON)
							.retrieve()
							.body(JsonNode.class);
			if (response == null) {
				throw new AmapTransportException(AmapTransportException.Code.UPSTREAM_FAILURE);
			}
			return response;
		} catch (RestClientException exception) {
			logger.warn("AMap request failed: endpoint={}", path);
			throw new AmapTransportException(AmapTransportException.Code.UPSTREAM_FAILURE);
		}
	}
}
