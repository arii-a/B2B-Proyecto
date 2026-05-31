package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.TramoTarifaRequest;
import com.example.B2BProyect.repository.dto.response.TramoTarifaDTO;
import com.example.B2BProyect.service.TramoTarifaService;
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
@RequestMapping("/api/v1/tramos-tarifa")
public class TramoTarifaController {
    private final TramoTarifaService tramoTarifaService;

    @GetMapping
    public ResponseEntity<List<TramoTarifaDTO>> findAll() {
        try {
            return ResponseEntity.ok(tramoTarifaService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los tramos de tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody TramoTarifaRequest tramoTarifa) {
        try {
            tramoTarifaService.save(tramoTarifa);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo tramo de tarifa: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
