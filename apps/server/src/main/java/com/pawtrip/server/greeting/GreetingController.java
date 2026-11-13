package com.pawtrip.server.greeting;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class GreetingController {

	private final GreetingRepository greetingRepository;

	GreetingController(GreetingRepository greetingRepository) {
		this.greetingRepository = greetingRepository;
	}

	@GetMapping("/api/greeting")
	GreetingResponse greeting() {
		return this.greetingRepository.findFirstByOrderByIdAsc()
				.map(greeting -> new GreetingResponse(greeting.getMessage()))
				.orElseThrow(GreetingNotFoundException::new);
	}

	record GreetingResponse(String message) {
	}

}
