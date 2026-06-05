package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ReglasComisionRequest;
import com.example.B2BProyect.repository.dto.response.ReglasComisionDTO;
import com.example.B2BProyect.service.ReglasComisionService;

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
@RequestMapping("/api/v1/reglas-comision")
public class ReglasComisionController {
    private final ReglasComisionService reglasComisionService;

    @GetMapping
    public ResponseEntity<List<ReglasComisionDTO>> findAll() {
        try {
            return ResponseEntity.ok(reglasComisionService.findAll());
        } catch (Exception e) {
            log.error("Error listando regla comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ReglasComisionRequest dto) {
        try {
            reglasComisionService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando regla comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReglasComisionDTO> update(@PathVariable UUID id, @RequestBody ReglasComisionRequest dto) {
        try {
            return reglasComisionService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando regla comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return reglasComisionService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando regla comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
