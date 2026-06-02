package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.MateriaRepository;
import com.example.B2BProyect.repository.dto.request.EstudianteRequest;
import com.example.B2BProyect.repository.dto.request.UsuarioRequest;
import com.example.B2BProyect.repository.dto.response.EstudianteDTO;
import com.example.B2BProyect.repository.dto.response.UsuarioDTO;
import com.example.B2BProyect.repository.entity.Estudiante;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.EstudianteService;
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
@RestController
@RequestMapping("/api/examen/estudiantes")
public class EstudianteController {
    private final EstudianteService estudianteService;
    private final MateriaRepository materiaRepository;

    @GetMapping
    public ResponseEntity<List<EstudianteDTO>> findAll() {
        try {
            return ResponseEntity.ok(estudianteService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los estudiantes: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<EstudianteDTO> save(@RequestBody EstudianteRequest estudianteRequest) {
        try {
            estudianteService.save(estudianteRequest);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo estudiante: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstudianteDTO> update(@PathVariable UUID id,
                                             @RequestBody EstudianteRequest dto) {
        try {
            return estudianteService.update(id, dto,
                            materiaRepository)
                    .map(u -> ResponseEntity.ok(new EstudianteDTO(u)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando estudiante: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
