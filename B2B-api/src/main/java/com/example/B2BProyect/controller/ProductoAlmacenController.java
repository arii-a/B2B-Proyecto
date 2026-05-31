package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ProductoAlmacenRequest;
import com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO;
import com.example.B2BProyect.service.ProductoAlmacenService;
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
@RequestMapping("/api/v1/productos-almacen")
public class ProductoAlmacenController {
    private final ProductoAlmacenService productoAlmacenService;

    @GetMapping
    public ResponseEntity<List<ProductoAlmacenDTO>> findAll() {
        try {
            return ResponseEntity.ok(productoAlmacenService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los productos de almacen: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ProductoAlmacenRequest productoAlmacen) {
        try {
            productoAlmacenService.save(productoAlmacen);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo producto de almacen: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
