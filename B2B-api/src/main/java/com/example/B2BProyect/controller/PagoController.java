package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.Customer;
import com.example.B2BProyect.integracion.SistemaB2B;
import com.example.B2BProyect.integracion.StereumApiRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    @Autowired
    private SistemaB2B sistemaB2B;

    @PostMapping("/crear-cobro")
    public ResponseEntity<?> crearCobro(@RequestBody Map<String, Object> body) {
        try {
            StereumApiRequest request = new StereumApiRequest();
            request.setCountry((String) body.get("country"));
            request.setAmount((String) body.get("amount"));
            request.setCurrency((String) body.get("currency"));
            request.setNetwork((String) body.get("network"));
            request.setChargeReason((String) body.get("charge_reason"));
            request.setReservationValidityTime((String) body.get("reservation_validity_time"));

            Map<String, String> c = (Map<String, String>) body.get("customer");
            Customer customer = new Customer();
            customer.setName(c.get("name"));
            customer.setLastname(c.get("lastname"));
            customer.setDocumentNumber(c.get("document_number"));
            request.setCustomer(customer);

            return ResponseEntity.ok(sistemaB2B.callStereum(request));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
