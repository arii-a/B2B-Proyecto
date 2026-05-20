package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.entity.Categoria;
import com.example.B2BProyect.service.CategoriaService;
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
@RequestMapping("/api/v1/categorias")
public class CategoriaController {
    private final CategoriaService categoriaService;

    @GetMapping
    public ResponseEntity<List<Categoria>> findAll() {
        try {
            return ResponseEntity.ok(categoriaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las categorías: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Categoria> save(@RequestBody Categoria categoria) {
        try {
            this.categoriaService.save(categoria);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva categoría: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
