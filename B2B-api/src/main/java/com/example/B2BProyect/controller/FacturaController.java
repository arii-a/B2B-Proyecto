package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.FacturaRequest;
import com.example.B2BProyect.repository.dto.response.FacturaDTO;
import com.example.B2BProyect.service.FacturaService;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/facturas")
public class FacturaController {
    private final FacturaService facturaService;

    @GetMapping
    public ResponseEntity<Page<FacturaDTO>> findAll(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "DESC") Sort.Direction sortDir,
            @RequestParam("from") @DateTimeFormat(pattern = "yyyy-MM-dd") Date from,
            @RequestParam("to") @DateTimeFormat(pattern = "yyyy-MM-dd") Date to) {
        try {
            return ResponseEntity.ok(facturaService.findAllByOrderByDateDesc(
                    from.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime(),
                    to.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime(),
                    PageRequest.of(page, size, Sort.by(sortDir, sortBy))));
        } catch (Exception e) {
            log.error("Error listando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody FacturaRequest dto) {
        try {
            facturaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FacturaDTO> update(@PathVariable UUID id, @RequestBody FacturaRequest dto) {
        try {
            return facturaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return facturaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando factura: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
