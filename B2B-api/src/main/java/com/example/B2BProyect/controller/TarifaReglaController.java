package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.TarifaReglaRequest;
import com.example.B2BProyect.repository.dto.response.TarifaReglaDTO;
import com.example.B2BProyect.service.TarifaReglaService;

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
@RequestMapping("/api/v1/tarifas-reglas")
public class TarifaReglaController {
    private final TarifaReglaService tarifaReglaService;

    @GetMapping
    public ResponseEntity<List<TarifaReglaDTO>> findAll() {
        try {
            return ResponseEntity.ok(tarifaReglaService.findAll());
        } catch (Exception e) {
            log.error("Error listando tarifa regla: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<TarifaReglaDTO> save(@RequestBody TarifaReglaRequest dto) {
        try {
            TarifaReglaDTO created = tarifaReglaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creando tarifa regla: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TarifaReglaDTO> update(@PathVariable UUID id, @RequestBody TarifaReglaRequest dto) {
        try {
            return tarifaReglaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando tarifa regla: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return tarifaReglaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando tarifa regla: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
