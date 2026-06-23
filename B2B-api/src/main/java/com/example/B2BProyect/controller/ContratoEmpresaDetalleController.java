package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.exception.OperationException;
import com.example.B2BProyect.repository.dto.request.ContratoEmpresaDetalleRequest;
import com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO;
import com.example.B2BProyect.service.ContratoEmpresaDetalleService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/contratos-detalle")
public class ContratoEmpresaDetalleController {
    private final ContratoEmpresaDetalleService contratoEmpresaDetalleService;

    @GetMapping
    public ResponseEntity<List<ContratoEmpresaDetalleDTO>> findAll() {
        try {
            return ResponseEntity.ok(contratoEmpresaDetalleService.findAll());
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error listando contrato detalle: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ContratoEmpresaDetalleRequest dto) {
        try {
            contratoEmpresaDetalleService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error creando contrato detalle: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContratoEmpresaDetalleDTO> update(@PathVariable UUID id, @RequestBody ContratoEmpresaDetalleRequest dto) {
        try {
            return contratoEmpresaDetalleService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error actualizando contrato detalle: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return contratoEmpresaDetalleService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error eliminando contrato detalle: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }
}
