package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.TarifaReglaRequest;
import com.example.B2BProyect.repository.dto.response.TarifaReglaDTO;
import com.example.B2BProyect.service.TarifaReglaService;
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
@RequestMapping("/api/v1/tarifas-regla")
public class TarifaReglaController {
    private final TarifaReglaService tarifaReglaService;

    @GetMapping
    public ResponseEntity<List<TarifaReglaDTO>> findAll() {
        try {
            return ResponseEntity.ok(tarifaReglaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a las tarifas regla: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody TarifaReglaRequest tarifaRegla) {
        try {
            tarifaReglaService.save(tarifaRegla);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nueva tarifa regla: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
