package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.Almacen;
import com.example.B2BProyect.service.AlmacenService;
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
@RequestMapping("/api/v1/almacenes")
public class AlmacenController {
    private final AlmacenService almacenService;

    @GetMapping
    public ResponseEntity<List<Almacen>> findAll() {
        try {
            return ResponseEntity.ok(almacenService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los almacenes: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Almacen> save(@RequestBody Almacen almacen) {
        try {
            almacenService.save(almacen);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo almacen: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
