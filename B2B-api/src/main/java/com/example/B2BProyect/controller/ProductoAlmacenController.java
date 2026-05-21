package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import com.example.B2BProyect.service.ProductoAlmacenService;
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
@RequestMapping("/api/v1/productos-almacen")
public class ProductoAlmacenController {
    private final ProductoAlmacenService productoAlmacenService;

    @GetMapping
    public ResponseEntity<List<ProductoAlmacen>> findAll() {
        try {
            return ResponseEntity.ok(productoAlmacenService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los productos por almacen: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<ProductoAlmacen> save(@RequestBody ProductoAlmacen productoAlmacen) {
        try {
            productoAlmacenService.save(productoAlmacen);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo producto por almacen: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
