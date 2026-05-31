package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.FacturaRequest;
import com.example.B2BProyect.repository.dto.response.FacturaDTO;
import com.example.B2BProyect.service.FacturaService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/facturas")
public class FacturaController {
    private final FacturaService facturaService;

    @GetMapping
    public ResponseEntity<List<FacturaDTO>> findAll() {
        try {
            return ResponseEntity.ok(facturaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las facturas: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody FacturaRequest factura) {
        try {
            facturaService.save(factura);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
