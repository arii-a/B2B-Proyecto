package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ContratoEmpresaTarifaRequest;
import com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO;
import com.example.B2BProyect.service.ContratoEmpresaTarifaService;
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
@RequestMapping("/api/v1/contratos-tarifa")
public class ContratoEmpresaTarifaController {
    private final ContratoEmpresaTarifaService contratoEmpresaTarifaService;

    @GetMapping
    public ResponseEntity<List<ContratoEmpresaTarifasDTO>> findAll() {
        try {
            return ResponseEntity.ok(contratoEmpresaTarifaService.findAll());
        } catch (Exception e) {
            log.error("Error listando contratos tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ContratoEmpresaTarifaRequest dto) {
        try {
            contratoEmpresaTarifaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando contrato tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContratoEmpresaTarifasDTO> update(@PathVariable UUID id,
                                                             @RequestBody ContratoEmpresaTarifaRequest dto) {
        try {
            return contratoEmpresaTarifaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando contrato tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return contratoEmpresaTarifaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando contrato tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
