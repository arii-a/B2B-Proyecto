package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.DetalleOrdenRequest;
import com.example.B2BProyect.repository.dto.response.DetalleOrdenDTO;
import com.example.B2BProyect.service.DetalleOrdenService;
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
@RequestMapping("/api/v1/detalles-orden")
public class DetalleOrdenController {
    private final DetalleOrdenService detalleOrdenService;

    @GetMapping
    public ResponseEntity<List<DetalleOrdenDTO>> findAll() {
        try {
            return ResponseEntity.ok(detalleOrdenService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los detalles de orden: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody DetalleOrdenRequest detalle) {
        try {
            detalleOrdenService.save(detalle);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo detalle de orden: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
