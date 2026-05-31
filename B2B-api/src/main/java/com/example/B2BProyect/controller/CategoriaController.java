package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.CategoriaRequest;
import com.example.B2BProyect.repository.dto.response.CategoriaDTO;
import com.example.B2BProyect.service.CategoriaService;
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
@RequestMapping("/api/v1/categorias")
public class CategoriaController {
    private final CategoriaService categoriaService;

    @GetMapping
    public ResponseEntity<List<CategoriaDTO>> findAll() {
        try {
            return ResponseEntity.ok(categoriaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las categorias: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody CategoriaRequest categoria) {
        try {
            categoriaService.save(categoria);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva categoria: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
