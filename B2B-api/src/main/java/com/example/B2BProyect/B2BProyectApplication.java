package com.example.B2BProyect;

import com.example.B2BProyect.integracion.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.web.config.SpringDataWebSettings;

@SpringBootApplication
public class B2BProyectApplication implements CommandLineRunner {
	@Autowired
    private SpringDataWebSettings springDataWebSettings;
	@Autowired
	private SistemaB2B sistemaB2B;


	public static void main(String[] args) {
		SpringApplication.run(B2BProyectApplication.class, args);

		System.out.println("Hola mundo");
	}

	@Override
	public void run(String... args) throws Exception {
		sistemaA.getAll(
				"/api/v1/sucursales-empresa",
				new ParameterizedTypeReference<>() {}
		);
		sistemaA.getAll(
				"/api/v1/usuarios",
				new ParameterizedTypeReference<>() {}
		);
		sistemaA.getAll(
				"/api/v1/roles-usuario",
				new ParameterizedTypeReference<>() {}
		);
		utilitario();
//		B2BAuthRequest request = new B2BAuthRequest();
//		request.setUsername("root");
//		request.setPassword("Abc123**");
//		B2BAuthResponse response = sistemaB2B.auth(request);
//		System.out.println(sistemaB2B.listCategorias());
//		System.out.println(sistemaB2B.list2());;
//		System.out.println(response);
		StereumApiRequest request1 = new StereumApiRequest();
		request1.setCountry("BO");
			request1.setAmount("6767");
			request1.setCurrency("USDT");
			request1.setNetwork("POLYGON");
			request1.setChargeReason("Compra de prueba");
			request1.setReservationValidityTime("10");
		Customer customer = new Customer();
			customer.setName("Ricardo");
			customer.setLastName("Laredo");
			customer.setDocumentNumber("76887344");
		StereuemApiResponse response1 = sistemaB2B.callStereum(request1);
		System.out.println(response1);
	}

	private void utilitario() {
	}


}
