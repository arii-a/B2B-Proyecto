package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ContratoEmpresaDetalleRequest;
import com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO;
import com.example.B2BProyect.service.ContratoEmpresaDetalleService;

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
@RequestMapping("/api/v1/contratos-detalle")
public class ContratoEmpresaDetalleController {
    private final ContratoEmpresaDetalleService contratoEmpresaDetalleService;

    @GetMapping
    public ResponseEntity<List<ContratoEmpresaDetalleDTO>> findAll() {
        try {
            return ResponseEntity.ok(contratoEmpresaDetalleService.findAll());
        } catch (Exception e) {
            log.error("Error listando contrato detalle: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ContratoEmpresaDetalleRequest dto) {
        try {
            contratoEmpresaDetalleService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando contrato detalle: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContratoEmpresaDetalleDTO> update(@PathVariable UUID id, @RequestBody ContratoEmpresaDetalleRequest dto) {
        try {
            return contratoEmpresaDetalleService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando contrato detalle: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return contratoEmpresaDetalleService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando contrato detalle: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
