package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.MateriaRepository;
import com.example.B2BProyect.repository.dto.request.EstudianteRequest;
import com.example.B2BProyect.repository.dto.response.EstudianteDTO;
import com.example.B2BProyect.repository.entity.Materia;
import com.example.B2BProyect.service.MateriaService;
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
@RequestMapping("/api/examen/materias")
public class MateriaController {
    private final MateriaRepository materiaRepository;
    private final MateriaService materiaService;

    @GetMapping
    public ResponseEntity<List<Materia>> findAll() {
        try {
            return ResponseEntity.ok(materiaRepository.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las materias: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<EstudianteDTO> save(@RequestBody Materia materia) {
        try {
            materiaRepository.save(materia);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva materia: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Materia> update(@PathVariable UUID id,
                                                @RequestBody Materia dto) {
        try {
            return materiaService.update(id, dto)
                    .map(u -> ResponseEntity.ok(new Materia(u)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando materia: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }


}
