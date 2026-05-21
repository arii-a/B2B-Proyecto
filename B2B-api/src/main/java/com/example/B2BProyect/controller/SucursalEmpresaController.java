package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.SucursalEmpresa;
import com.example.B2BProyect.service.SucursalEmpresaService;
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
@RequestMapping("/api/v1/sucursales-empresa")
public class SucursalEmpresaController {
    private final SucursalEmpresaService sucursalEmpresaService;

    @GetMapping
    public ResponseEntity<List<SucursalEmpresa>> findAll() {
        try {
            return ResponseEntity.ok(sucursalEmpresaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las sucursales de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<SucursalEmpresa> save(@RequestBody SucursalEmpresa sucursalEmpresa) {
        try {
            sucursalEmpresaService.save(sucursalEmpresa);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva sucursal de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
