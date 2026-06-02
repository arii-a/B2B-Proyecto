package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ComisionRequest;
import com.example.B2BProyect.repository.dto.response.ComisionDTO;
import com.example.B2BProyect.service.ComisionService;

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
@RequestMapping("/api/v1/comisiones")
public class ComisionController {
    private final ComisionService comisionService;

    @GetMapping
    public ResponseEntity<List<ComisionDTO>> findAll() {
        try {
            return ResponseEntity.ok(comisionService.findAll());
        } catch (Exception e) {
            log.error("Error listando comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ComisionRequest dto) {
        try {
            comisionService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComisionDTO> update(@PathVariable UUID id, @RequestBody ComisionRequest dto) {
        try {
            return comisionService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return comisionService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando comisión: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
