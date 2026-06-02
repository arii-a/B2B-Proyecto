package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.TramoTarifaRequest;
import com.example.B2BProyect.repository.dto.response.TramoTarifaDTO;
import com.example.B2BProyect.service.TramoTarifaService;

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
@RequestMapping("/api/v1/tramos-tarifa")
public class TramoTarifaController {
    private final TramoTarifaService tramoTarifaService;

    @GetMapping
    public ResponseEntity<List<TramoTarifaDTO>> findAll() {
        try {
            return ResponseEntity.ok(tramoTarifaService.findAll());
        } catch (Exception e) {
            log.error("Error listando tramo tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody TramoTarifaRequest dto) {
        try {
            tramoTarifaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando tramo tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TramoTarifaDTO> update(@PathVariable UUID id, @RequestBody TramoTarifaRequest dto) {
        try {
            return tramoTarifaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando tramo tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return tramoTarifaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando tramo tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
