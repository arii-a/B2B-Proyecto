package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ReglasComisionRequest;
import com.example.B2BProyect.repository.dto.response.ReglasComisionDTO;
import com.example.B2BProyect.service.ReglasComisionService;
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
@RequestMapping("/api/v1/reglas-comision")
public class ReglasComisionController {
    private final ReglasComisionService reglasComisionService;

    @GetMapping
    public ResponseEntity<List<ReglasComisionDTO>> findAll() {
        try {
            return ResponseEntity.ok(reglasComisionService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las reglas de comision: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ReglasComisionRequest regla) {
        try {
            reglasComisionService.save(regla);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva regla de comision: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
