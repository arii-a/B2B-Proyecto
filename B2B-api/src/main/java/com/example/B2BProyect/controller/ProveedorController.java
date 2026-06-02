package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ProveedorRequest;
import com.example.B2BProyect.repository.dto.response.ProveedorDTO;
import com.example.B2BProyect.service.ProveedorService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@Slf4j
@AllArgsConstructor
@RequestMapping("/api/v1/proveedores")
public class ProveedorController {
    private final ProveedorService proveedorService;

    @GetMapping
    public ResponseEntity<List<ProveedorDTO>> findAll() {
        try {
            return ResponseEntity.ok(proveedorService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los proveedores: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id_empresa}")
    public ResponseEntity<Void> save(@PathVariable("id_empresa") UUID idEmpresa,
                                     @RequestBody ProveedorRequest proveedor) {
        try {
            proveedorService.save(idEmpresa, proveedor);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("No se ha podido crear el nuevo proveedor: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProveedorDTO> update(@PathVariable UUID id, @RequestBody ProveedorRequest dto) {
        try {
            return proveedorService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando proveedor: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return proveedorService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando proveedor: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
