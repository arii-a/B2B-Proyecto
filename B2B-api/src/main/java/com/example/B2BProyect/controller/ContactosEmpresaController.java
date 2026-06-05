package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ContactosEmpresaRequest;
import com.example.B2BProyect.repository.dto.response.ContactosEmpresaDTO;
import com.example.B2BProyect.service.ContactosEmpresaService;

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
@RequestMapping("/api/v1/contactos-empresa")
public class ContactosEmpresaController {
    private final ContactosEmpresaService contactosEmpresaService;

    @GetMapping
    public ResponseEntity<List<ContactosEmpresaDTO>> findAll() {
        try {
            return ResponseEntity.ok(contactosEmpresaService.findAll());
        } catch (Exception e) {
            log.error("Error listando contacto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ContactosEmpresaRequest dto) {
        try {
            contactosEmpresaService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando contacto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactosEmpresaDTO> update(@PathVariable UUID id, @RequestBody ContactosEmpresaRequest dto) {
        try {
            return contactosEmpresaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando contacto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return contactosEmpresaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando contacto: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
