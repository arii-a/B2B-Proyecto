package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.service.ProductoService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/products")
public class ProductoController {
    private final ProductoService productoService;

    @GetMapping()
    public ResponseEntity<List<Producto>> findAll() {
        try {
            return ResponseEntity.ok(productoService.findAll());
        } catch (Exception e) {
            log.error("Error al listar empresas");
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{categoria_id}/{proveedor_id}")
    public ResponseEntity<Producto> save(@PathVariable("categoria_id") UUID categoriaId,
                                         @PathVariable("proveedor_id") UUID proveedorId,
                                         @RequestBody Producto producto) {
        try {
            this.productoService.save(categoriaId, proveedorId, producto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error al guardar producto");
            return ResponseEntity.badRequest().build();
        }
    }

}
