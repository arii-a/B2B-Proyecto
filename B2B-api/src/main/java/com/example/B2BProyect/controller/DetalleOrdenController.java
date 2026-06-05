package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.DetalleOrdenRequest;
import com.example.B2BProyect.repository.dto.response.DetalleOrdenDTO;
import com.example.B2BProyect.service.DetalleOrdenService;

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
@RequestMapping("/api/v1/detalle-orden")
public class DetalleOrdenController {
    private final DetalleOrdenService detalleOrdenService;

    @GetMapping
    public ResponseEntity<List<DetalleOrdenDTO>> findAll() {
        try {
            return ResponseEntity.ok(detalleOrdenService.findAll());
        } catch (Exception e) {
            log.error("Error listando detalle orden: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody DetalleOrdenRequest dto) {
        try {
            detalleOrdenService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando detalle orden: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DetalleOrdenDTO> update(@PathVariable UUID id, @RequestBody DetalleOrdenRequest dto) {
        try {
            return detalleOrdenService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando detalle orden: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return detalleOrdenService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando detalle orden: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
