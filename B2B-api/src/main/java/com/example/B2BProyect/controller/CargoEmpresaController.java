package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.CargoEmpresaRequest;
import com.example.B2BProyect.repository.dto.response.CargoEmpresaDTO;
import com.example.B2BProyect.service.CargoEmpresaService;

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
@RequestMapping("/api/v1/cargos-empresa")
public class CargoEmpresaController {
    private final CargoEmpresaService cargoEmpresaService;

    @GetMapping
    public ResponseEntity<List<CargoEmpresaDTO>> findAll() {
        try {
            return ResponseEntity.ok(cargoEmpresaService.findAll());
        } catch (Exception e) {
            log.error("Error listando cargo empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody CargoEmpresaRequest dto) {
        try {
            cargoEmpresaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando cargo empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CargoEmpresaDTO> update(@PathVariable UUID id, @RequestBody CargoEmpresaRequest dto) {
        try {
            return cargoEmpresaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando cargo empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return cargoEmpresaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando cargo empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
