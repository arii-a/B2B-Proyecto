package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.*;
import com.example.B2BProyect.integracion.stereum.PaymentRequest;
import com.example.B2BProyect.integracion.stereum.StereuemApiResponse;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import com.example.B2BProyect.service.FacturaService;
import com.example.B2BProyect.service.OrdenCompraService;
import com.example.B2BProyect.service.StereumPollingService;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

import static org.springframework.http.ResponseEntity.ok;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/stereum")
public class StereumController {

    @Value("${stereum.account.id}")
    private String accountId;

    private final SistemaB2B sistemaB2B;
    private final OrdenCompraService ordenCompraService;
    private final FacturaService facturaService;
    private final StereumPollingService pollingService;

    @PostMapping("/charge")
    public ResponseEntity<?> charge(@RequestBody PaymentRequest request) {
        OrdenCompra ordenCompra = ordenCompraService.findById(request.getOrderId()).get();
        try {
            JSONObject customer = new JSONObject();
            customer.put("name", ordenCompra.getIdUsuario().getNombre());
            customer.put("lastname", "Laredo");
            customer.put("document_number", "76887344");

            JSONObject req = new JSONObject();
            req.put("account_id", accountId);
            req.put("country", "BO");
            req.put("amount", String.valueOf(ordenCompra.getTotal().intValue()));
            req.put("currency", "BOB");
            req.put("network", "CSL");
            req.put("charge_reason", "COMPRA A: "); //  + ordenCompra.getIdProveedor().getIdEmpresa().getNombre())
//            req.put("charge_reason", "COMPRA A: " + ordenCompra.getIdProveedor().getIdEmpresa().getNombre());
            req.put("idempotency_key", ordenCompra.getId().toString());
            req.put("reservation_validity_time", "10");
            req.put("customer", customer);

            StereuemApiResponse stereumResponse = sistemaB2B.callStereum(req);

            if (stereumResponse.getId() != null) {
                pollingService.pollUntilComplete(stereumResponse.getId(), request.getOrderId());
            }

            return ok(stereumResponse);
        } catch (Exception e) {
            log.error("Error generando QR Stereum: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "Error al conectar con Stereum";
            return ResponseEntity.badRequest().body(Map.of("message", msg));
        }
    }
}
