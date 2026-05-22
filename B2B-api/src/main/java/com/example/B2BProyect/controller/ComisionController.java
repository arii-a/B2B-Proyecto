package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.Comision;
import com.example.B2BProyect.service.ComisionService;
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
@RequestMapping("/api/v1/comisiones")
public class ComisionController {
    private final ComisionService comisionService;

    @GetMapping
    public ResponseEntity<List<Comision>> findAll() {
        try {
            return ResponseEntity.ok(comisionService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las comisiones: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Comision> save(@RequestBody Comision comision) {
        try {
            comisionService.save(comision);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva comision: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
