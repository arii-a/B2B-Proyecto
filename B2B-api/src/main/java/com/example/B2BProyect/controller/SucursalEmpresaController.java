package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.SucursalEmpresaRequest;
import com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO;
import com.example.B2BProyect.service.SucursalEmpresaService;
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
@RequestMapping("/api/v1/sucursales-empresa")
public class SucursalEmpresaController {
    private final SucursalEmpresaService sucursalEmpresaService;

    @GetMapping
    public ResponseEntity<List<SucursalEmpresaDTO>> findAll() {
        try {
            return ResponseEntity.ok(sucursalEmpresaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las sucursales de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody SucursalEmpresaRequest sucursalEmpresa) {
        try {
            sucursalEmpresaService.save(sucursalEmpresa);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva sucursal de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SucursalEmpresaDTO> update(@PathVariable UUID id,
                                                      @RequestBody SucursalEmpresaRequest dto) {
        try {
            return sucursalEmpresaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando sucursal: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return sucursalEmpresaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando sucursal: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
