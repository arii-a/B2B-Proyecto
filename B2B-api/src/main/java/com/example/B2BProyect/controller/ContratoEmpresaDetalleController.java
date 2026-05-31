package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ContratoEmpresaDetalleRequest;
import com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO;
import com.example.B2BProyect.service.ContratoEmpresaDetalleService;
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
@RequestMapping("/api/v1/contratos-empresa-detalle")
public class ContratoEmpresaDetalleController {
    private final ContratoEmpresaDetalleService contratoEmpresaDetalleService;

    @GetMapping
    public ResponseEntity<List<ContratoEmpresaDetalleDTO>> findAll() {
        try {
            return ResponseEntity.ok(contratoEmpresaDetalleService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los detalles de contrato: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ContratoEmpresaDetalleRequest detalle) {
        try {
            contratoEmpresaDetalleService.save(detalle);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo detalle de contrato: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
