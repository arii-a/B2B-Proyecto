package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.FacturaRequest;
import com.example.B2BProyect.repository.dto.response.FacturaDTO;
import com.example.B2BProyect.service.FacturaService;
import org.springframework.data.domain.Page;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

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
            log.error("Error listando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<FacturaDTO>> findAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(facturaService.findAllPaged(page, size));
        } catch (Exception e) {
            log.error("Error listando facturas paginadas: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody FacturaRequest dto) {
        try {
            facturaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacturaDTO> update(@PathVariable UUID id, @RequestBody FacturaRequest dto) {
        try {
            return facturaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return facturaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
