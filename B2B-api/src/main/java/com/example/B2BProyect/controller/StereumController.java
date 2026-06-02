package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.Customer;
import com.example.B2BProyect.integracion.SistemaB2B;
import com.example.B2BProyect.integracion.StereumApiRequest;
import com.example.B2BProyect.integracion.StereuemApiResponse;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/stereum")
public class StereumController {

    private final SistemaB2B sistemaB2B;

    @PostMapping("/charge")
    public ResponseEntity<?> charge(@RequestBody ChargeRequest request) {
        try {
            Customer customer = new Customer(
                    "Ricardo",
                    "Laredo",
                    "76887344");
            StereumApiRequest req = new StereumApiRequest(
                    "BO",
                    String.valueOf(request.getAmount()),
                    "USDT",
                    "POLYGON",
                    "Compra de prueba",
                    "10",
                    customer
            );
            return ResponseEntity.ok(sistemaB2B.callStereum(req));
        } catch (Exception e) {
            log.error("Error generando QR Stereum: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "Error al conectar con Stereum";
            return ResponseEntity.badRequest().body(Map.of("message", msg));
        }
    }

    @Getter
    @Setter
    public static class ChargeRequest {
        private double amount;
        private UUID orderId;
    }
}
