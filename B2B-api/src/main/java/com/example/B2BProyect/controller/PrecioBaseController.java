package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.PrecioBase;
import com.example.B2BProyect.service.PrecioBaseService;
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
@RequestMapping("/api/v1/precios-base")
public class PrecioBaseController {
    private final PrecioBaseService precioBaseService;

    @GetMapping
    public ResponseEntity<List<PrecioBase>> findAll() {
        try {
            return ResponseEntity.ok(precioBaseService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los precios base: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<PrecioBase> save(@RequestBody PrecioBase precioBase) {
        try {
            precioBaseService.save(precioBase);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo precio base: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
