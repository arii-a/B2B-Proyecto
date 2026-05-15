package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.Proveedor;
import com.example.B2BProyect.service.ProveedorService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    public ResponseEntity<List<Proveedor>> findAll() {
        try {
            return ResponseEntity.ok(proveedorService.findAll());
        } catch (Exception e) {
            log.error(e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id_empresa}")
    public ResponseEntity<Proveedor> save(@PathVariable("id_empresa") UUID id_empresa,
                                          @RequestBody Proveedor proveedor) {
        try {
            this.proveedorService.save(id_empresa, proveedor);
            return ResponseEntity.ok(proveedor);
        } catch (Exception e) {
            log.error("No se ha podido crear el nuevo proveedor: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
