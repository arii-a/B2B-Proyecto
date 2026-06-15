package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.StereumPayResponse;
import com.example.B2BProyect.repository.dto.request.EmpresaRequest;
import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.EmpresaService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
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
    public ResponseEntity<Page<EmpresaDTO>> findAll(@RequestParam(value = "page", defaultValue = "5") Integer page, @RequestParam(value = "size", defaultValue = "10") Integer size, @RequestParam(value = "sortBy", defaultValue = "name") String sortBy) {
        Usuario user = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.info(user.getIdRol().getNombre());
        try {
            return ResponseEntity.ok(empresaService.findAll(page,size,sortBy));
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

    @PostMapping("/examen")
    public ResponseEntity<Void> metodoExamen(@RequestBody String body){
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            EmpresaDTO response = objectMapper.readValue(body, EmpresaDTO.class);
//            this.empresaService.cambiarRegistro(response.getId());
            return ResponseEntity.ok().build();
        } catch (Exception e){
            log.error("El error es: " + e);
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

//    @PutMapping("/examen/{id}")
//    public ResponseEntity<EmpresaDTO> updateExamen(@PathVariable UUID id, @RequestBody EmpresaRequest dto) {
//        try {
//            empresaService.modificarEmpresa(id, dto);
//            return ResponseEntity.ok().build();
//        } catch (NullPointerException e) {
//            log.error("Empresa no se halló: {}", e.getMessage());
//            return ResponseEntity.notFound().build();
//        } catch (Exception e) {
//            log.error("Error actualizando empresa: {}", e.getMessage());
//            return ResponseEntity.badRequest().build();
//        }
//    }

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
