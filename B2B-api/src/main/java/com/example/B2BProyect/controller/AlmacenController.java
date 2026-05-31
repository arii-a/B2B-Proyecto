package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.AlmacenRequest;
import com.example.B2BProyect.repository.dto.response.AlmacenDTO;
import com.example.B2BProyect.service.AlmacenService;
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
@RequestMapping("/api/v1/almacenes")
public class AlmacenController {
    private final AlmacenService almacenService;

    @GetMapping
    public ResponseEntity<List<AlmacenDTO>> findAll() {
        try {
            return ResponseEntity.ok(almacenService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los almacenes: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody AlmacenRequest almacen) {
        try {
            almacenService.save(almacen);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo almacen: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
