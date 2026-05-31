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

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/contratos-empresa-tarifa")
public class ContratoEmpresaTarifaController {
    private final ContratoEmpresaTarifaService contratoEmpresaTarifaService;

    @GetMapping
    public ResponseEntity<List<ContratoEmpresaTarifasDTO>> findAll() {
        try {
            return ResponseEntity.ok(contratoEmpresaTarifaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los contratos de empresa tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ContratoEmpresaTarifaRequest contrato) {
        try {
            contratoEmpresaTarifaService.save(contrato);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo contrato de empresa tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
