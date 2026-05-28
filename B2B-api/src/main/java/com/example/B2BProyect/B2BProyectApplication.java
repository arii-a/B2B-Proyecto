package com.example.B2BProyect;

import com.example.B2BProyect.service.integration.SistemaA;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.ParameterizedTypeReference;

@SpringBootApplication
public class B2BProyectApplication implements CommandLineRunner {
	@Autowired
	private SistemaA sistemaA;

	public static void main(String[] args) {
		SpringApplication.run(B2BProyectApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		sistemaA.getAll(
				"/api/v1/sucursales-empresa",
				new ParameterizedTypeReference<>() {}
		);
	}


}
