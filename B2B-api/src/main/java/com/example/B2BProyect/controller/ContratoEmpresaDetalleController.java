package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.ContratoEmpresaDetalle;
import com.example.B2BProyect.service.ContratoEmpresaDetalleService;
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
@RequestMapping("/api/v1/contratos-empresa-detalle")
public class ContratoEmpresaDetalleController {
    private final ContratoEmpresaDetalleService contratoEmpresaDetalleService;

    @GetMapping
    public ResponseEntity<List<ContratoEmpresaDetalle>> findAll() {
        try {
            return ResponseEntity.ok(contratoEmpresaDetalleService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los detalles de contrato de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ContratoEmpresaDetalle> save(@RequestBody ContratoEmpresaDetalle contratoEmpresaDetalle) {
        try {
            contratoEmpresaDetalleService.save(contratoEmpresaDetalle);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo detalle de contrato de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
