package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ProductoRequest;
import com.example.B2BProyect.repository.dto.response.ProductoDTO;
import com.example.B2BProyect.service.ProductoService;
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
@RequestMapping("/api/v1/products")
public class ProductoController {
    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<ProductoDTO>> findAll() {
        try {
            return ResponseEntity.ok(productoService.findAll());
        } catch (Exception e) {
            log.error("Error al listar productos: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ProductoRequest producto) {
        try {
            productoService.save(producto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error al guardar producto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
