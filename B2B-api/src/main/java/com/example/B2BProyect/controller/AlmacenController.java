package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.AlmacenRequest;
import com.example.B2BProyect.repository.dto.response.AlmacenDTO;
import com.example.B2BProyect.service.AlmacenService;

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
@RequestMapping("/api/v1/almacenes")
public class AlmacenController {
    private final AlmacenService almacenService;

    @GetMapping
    public ResponseEntity<List<AlmacenDTO>> findAll() {
        try {
            return ResponseEntity.ok(almacenService.findAll());
        } catch (Exception e) {
            log.error("Error listando almacén: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody AlmacenRequest dto) {
        try {
            almacenService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando almacén: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlmacenDTO> update(@PathVariable UUID id, @RequestBody AlmacenRequest dto) {
        try {
            return almacenService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando almacén: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return almacenService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando almacén: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
