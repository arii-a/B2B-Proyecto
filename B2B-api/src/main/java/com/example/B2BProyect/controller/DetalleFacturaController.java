package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.DetalleFactura;
import com.example.B2BProyect.service.DetalleFacturaService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/detalles-factura")
public class DetalleFacturaController {
    private final DetalleFacturaService detalleFacturaService;

    @GetMapping
    public ResponseEntity<List<DetalleFactura>> findAll() {
        try {
            return ResponseEntity.ok(detalleFacturaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los detalles de factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<DetalleFactura> save(@RequestBody DetalleFactura detalleFactura) {
        try {
            detalleFacturaService.save(detalleFactura);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo detalle de factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
