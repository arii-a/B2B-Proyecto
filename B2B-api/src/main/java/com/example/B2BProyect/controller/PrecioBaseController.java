package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.PrecioBaseRequest;
import com.example.B2BProyect.repository.dto.response.PrecioBaseDTO;
import com.example.B2BProyect.service.PrecioBaseService;

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
@RequestMapping("/api/v1/precios-base")
public class PrecioBaseController {
    private final PrecioBaseService precioBaseService;

    @GetMapping
    public ResponseEntity<List<PrecioBaseDTO>> findAll() {
        try {
            return ResponseEntity.ok(precioBaseService.findAll());
        } catch (Exception e) {
            log.error("Error listando precio base: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody PrecioBaseRequest dto) {
        try {
            precioBaseService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando precio base: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PrecioBaseDTO> update(@PathVariable UUID id, @RequestBody PrecioBaseRequest dto) {
        try {
            return precioBaseService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando precio base: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return precioBaseService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando precio base: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
