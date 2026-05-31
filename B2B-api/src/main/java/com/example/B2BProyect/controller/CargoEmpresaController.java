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
            log.error("Error llamando a los cargos de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody CargoEmpresaRequest cargoEmpresa) {
        try {
            cargoEmpresaService.save(cargoEmpresa);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo cargo de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
