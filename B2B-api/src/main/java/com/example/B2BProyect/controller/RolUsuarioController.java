package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.RolUsuarioRequest;
import com.example.B2BProyect.repository.dto.response.RolUsuarioDTO;
import com.example.B2BProyect.service.RolUsuarioService;

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
@RequestMapping("/api/v1/roles")
public class RolUsuarioController {
    private final RolUsuarioService rolUsuarioService;

    @GetMapping
    public ResponseEntity<List<RolUsuarioDTO>> findAll() {
        try {
            return ResponseEntity.ok(rolUsuarioService.findAll());
        } catch (Exception e) {
            log.error("Error listando rol: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody RolUsuarioRequest dto) {
        try {
            rolUsuarioService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando rol: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<RolUsuarioDTO> update(@PathVariable UUID id, @RequestBody RolUsuarioRequest dto) {
        try {
            return rolUsuarioService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando rol: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return rolUsuarioService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando rol: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
