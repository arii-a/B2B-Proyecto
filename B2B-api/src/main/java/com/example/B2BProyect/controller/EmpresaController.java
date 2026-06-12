package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.EmpresaRequest;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.EmpresaService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/empresas")
public class EmpresaController {
    private final EmpresaService empresaService;

    @GetMapping
    public ResponseEntity<List<EmpresaDTO>> findAll() {
        Usuario user = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.info(user.getIdRol().getNombre());
        try {
            return ResponseEntity.ok(empresaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las empresas: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<EmpresaDTO> save(@RequestBody EmpresaRequest empresa) {
        try {
            EmpresaDTO created = this.empresaService.save(empresa);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creando nueva empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmpresaDTO> update(@PathVariable UUID id, @RequestBody EmpresaRequest dto) {
        try {
            return empresaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/examen/{id}")
    public ResponseEntity<EmpresaDTO> updateExamen(@PathVariable UUID id, @RequestBody EmpresaRequest dto) {
        try {
            empresaService.modificarEmpresa(id, dto);
            return ResponseEntity.ok().build();
        } catch (NullPointerException e) {
            log.error("Empresa no se halló: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error actualizando empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return empresaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando empresa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
