package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.UnidadMedidaRequest;
import com.example.B2BProyect.repository.dto.response.UnidadMedidaDTO;
import com.example.B2BProyect.service.UnidadMedidaService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/unidades-medida")
public class UnidadMedidaController {

    private final UnidadMedidaService unidadMedidaService;

    @GetMapping
    public ResponseEntity<List<UnidadMedidaDTO>> findAll() {
        try {
            return ResponseEntity.ok(unidadMedidaService.findAll());
        } catch (Exception e) {
            log.error("Error listando unidades de medida", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al listar unidades de medida");
        }
    }

    @GetMapping("/activas")
    public ResponseEntity<List<UnidadMedidaDTO>> findAllActivas() {
        try {
            return ResponseEntity.ok(unidadMedidaService.findAllActivas());
        } catch (Exception e) {
            log.error("Error listando unidades de medida activas", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al listar unidades de medida activas");
        }
    }

    @PostMapping
    public ResponseEntity<UnidadMedidaDTO> save(@RequestBody UnidadMedidaRequest dto) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(unidadMedidaService.save(dto));
        } catch (Exception e) {
            log.error("Error creando unidad de medida", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al crear unidad de medida");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UnidadMedidaDTO> update(@PathVariable UUID id, @RequestBody UnidadMedidaRequest dto) {
        try {
            return unidadMedidaService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando unidad de medida", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al actualizar unidad de medida");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return unidadMedidaService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando unidad de medida", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al eliminar unidad de medida");
        }
    }
}
