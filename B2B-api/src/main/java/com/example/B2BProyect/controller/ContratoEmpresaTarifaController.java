package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.ContratoEmpresaTarifa;
import com.example.B2BProyect.service.ContratoEmpresaTarifaService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/contratos-empresa-tarifa")
public class ContratoEmpresaTarifaController {
    private final ContratoEmpresaTarifaService contratoEmpresaTarifaService;

    @GetMapping
    public ResponseEntity<List<ContratoEmpresaTarifa>> findAll() {
        try {
            return ResponseEntity.ok(contratoEmpresaTarifaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los contratos empresa tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ContratoEmpresaTarifa> save(@RequestBody ContratoEmpresaTarifa contratoEmpresaTarifa) {
        try {
            contratoEmpresaTarifaService.save(contratoEmpresaTarifa);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo contrato empresa tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
