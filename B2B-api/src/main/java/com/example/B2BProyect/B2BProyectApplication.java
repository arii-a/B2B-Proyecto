package com.example.B2BProyect;

import com.example.B2BProyect.integracion.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.math.BigInteger;
import java.util.UUID;

@Slf4j
@SpringBootApplication
@EnableAsync
@EnableScheduling
@EnableJpaAuditing(auditorAwareRef = "auditorAware")
public class B2BProyectApplication implements CommandLineRunner {

	@Autowired
	private SistemaB2B sistemaB2B;

	public static void main(String[] args) {
		SpringApplication.run(B2BProyectApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		/*try {
			Customer customer = new Customer();
			customer.setName("Ricardo");
			customer.setLastname("Laredo");
			customer.setDocumentNumber("76887344");

			StereumApiRequest request1 = new StereumApiRequest();
			request1.setCountry("BO");
			request1.setAmount("100");
			request1.setCurrency("BS");
			request1.setNetwork("POLYGON");
			request1.setChargeReason("Compra de prueba");
			request1.setReservationValidityTime("10");
			request1.setIdempotencyKey(UUID.randomUUID().toString());
			request1.setCustomer(customer);

			StereuemApiResponse response1 = sistemaB2B.callStereum(request1);
			// System.out.println(response1); <- No es necesario imprimir con la configuracion actual
			//System.out.println(sistemaB2B.listBanks("BO"));
		} catch (Exception e) {
			log.error("Integration call failed on startup: {}", e.getMessage());
		}*/


		/*B2BAuthRequest request = new B2BAuthRequest();
		request.setEmail("root@nadamenos.com");
		request.setPasswordHash("Abc123**");
		B2BAuthResponse response = sistemaB2B.auth(request);
		System.out.println(response);*/
	}
}
