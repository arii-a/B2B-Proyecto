package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.OrdenCompraRequest;
import com.example.B2BProyect.repository.dto.response.OrdenCompraDTO;
import com.example.B2BProyect.service.OrdenCompraService;
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
@RequestMapping("/api/v1/ordenes-compra")
public class OrdenCompraController {
    private final OrdenCompraService ordenCompraService;

    @GetMapping
    public ResponseEntity<List<OrdenCompraDTO>> findAll() {
        try {
            return ResponseEntity.ok(ordenCompraService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las ordenes de compra: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody OrdenCompraRequest orden) {
        try {
            ordenCompraService.save(orden);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva orden de compra: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
