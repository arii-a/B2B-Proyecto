package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.exception.OperationException;
import com.example.B2BProyect.repository.dto.request.DetalleFacturaRequest;
import com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO;
import com.example.B2BProyect.service.DetalleFacturaService;

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
@RequestMapping("/api/v1/detalle-factura")
public class DetalleFacturaController {
    private final DetalleFacturaService detalleFacturaService;

    @GetMapping
    public ResponseEntity<List<DetalleFacturaDTO>> findAll() {
        try {
            return ResponseEntity.ok(detalleFacturaService.findAll());
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error listando detalle factura: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody DetalleFacturaRequest dto) {
        try {
            detalleFacturaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error creando detalle factura: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<DetalleFacturaDTO> update(@PathVariable UUID id, @RequestBody DetalleFacturaRequest dto) {
        try {
            return detalleFacturaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error actualizando detalle factura: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return detalleFacturaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error eliminando detalle factura: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }
}
