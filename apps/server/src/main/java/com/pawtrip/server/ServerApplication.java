package com.pawtrip.server;

import com.pawtrip.server.infrastructure.amap.config.AmapDotenvInitializer;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ServerApplication {

	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(ServerApplication.class);
		application.addInitializers(new AmapDotenvInitializer());
		application.run(args);
	}

}
