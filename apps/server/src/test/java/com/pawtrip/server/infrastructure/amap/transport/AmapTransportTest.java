package com.pawtrip.server.infrastructure.amap.transport;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.pawtrip.server.infrastructure.amap.config.AmapProperties;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

class AmapTransportTest {

	private MockRestServiceServer mockServer;

	@BeforeEach
	void setUp() {
		RestClient.Builder clientBuilder = RestClient.builder().baseUrl("https://restapi.amap.com");
		mockServer = MockRestServiceServer.bindTo(clientBuilder).build();
		transport =
				new AmapTransport(
						clientBuilder.build(),
						new AmapProperties(
								"", "https://restapi.amap.com", Duration.ofSeconds(2), Duration.ofSeconds(5)));
	}

	private AmapTransport transport;

	@Test
	void missingApiKeyFailsBeforeMakingAnOutboundRequest() {
		assertThatThrownBy(() -> transport.getJson("/v5/place/text", java.util.Map.of("keywords", "cafe")))
				.isInstanceOf(AmapTransportException.class)
					.extracting("code")
					.isEqualTo(AmapTransportException.Code.MISSING_API_KEY);

		mockServer.verify();
	}
}
