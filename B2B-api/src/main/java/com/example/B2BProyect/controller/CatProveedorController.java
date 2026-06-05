package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.CatProveedorRequest;
import com.example.B2BProyect.repository.dto.response.CatProveedorDTO;
import com.example.B2BProyect.service.CatProveedorService;
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
@RequestMapping("/api/v1/categorias-proveedor")
public class CatProveedorController {
    private final CatProveedorService catProveedorService;

    @GetMapping
    public ResponseEntity<List<CatProveedorDTO>> findAll() {
        try {
            return ResponseEntity.ok(catProveedorService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las categorias de proveedor: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody CatProveedorRequest catProveedor) {
        try {
            catProveedorService.save(catProveedor);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva categoria de proveedor: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
