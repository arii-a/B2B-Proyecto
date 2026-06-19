package com.example.B2BProyect;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.EnableAsync;

@Slf4j
@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class B2BProyectApplication implements CommandLineRunner {
	
	public static void main(String[] args) {
		SpringApplication.run(B2BProyectApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {

	}
}
