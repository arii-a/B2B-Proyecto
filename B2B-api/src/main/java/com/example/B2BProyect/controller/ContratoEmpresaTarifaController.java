package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.exception.OperationException;
import com.example.B2BProyect.repository.dto.request.ContratoEmpresaTarifaRequest;
import com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO;
import com.example.B2BProyect.service.ContratoEmpresaTarifaService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

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
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error listando contratos tarifa: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<ContratoEmpresaTarifasDTO>> findAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(contratoEmpresaTarifaService.findAllPaged(page, size));
        } catch (Exception e) {
            log.error("Error listando contratos tarifa paginados: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PostMapping
    public ResponseEntity<ContratoEmpresaTarifasDTO> save(@RequestBody ContratoEmpresaTarifaRequest dto) {
        try {
            ContratoEmpresaTarifasDTO created = contratoEmpresaTarifaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error creando contrato tarifa: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContratoEmpresaTarifasDTO> update(@PathVariable UUID id,
                                                             @RequestBody ContratoEmpresaTarifaRequest dto) {
        try {
            return contratoEmpresaTarifaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error actualizando contrato tarifa: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return contratoEmpresaTarifaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error eliminando contrato tarifa: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }
}
