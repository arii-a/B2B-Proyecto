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
            log.error("Error llamando a los contactos de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ContactosEmpresaRequest contacto) {
        try {
            contactosEmpresaService.save(contacto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo contacto de empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
