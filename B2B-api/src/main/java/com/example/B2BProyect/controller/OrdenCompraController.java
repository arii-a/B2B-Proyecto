package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.*;
import com.example.B2BProyect.repository.dto.request.OrdenCompraRequest;
import com.example.B2BProyect.repository.dto.response.OrdenCompraDTO;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.Proveedor;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.*;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/ordenes-compra")
public class OrdenCompraController {
    private final OrdenCompraService ordenCompraService;

    @GetMapping
    public ResponseEntity<Page<OrdenCompraDTO>> findAll(
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "DESC") Sort.Direction sortDir,
            @RequestParam("from") @DateTimeFormat(pattern = "yyyy-MM-dd") Date from,
            @RequestParam("to") @DateTimeFormat(pattern = "yyyy-MM-dd") Date to) {
        try {
            return ResponseEntity.ok(ordenCompraService.findAllByOrderByDateDesc(
                    from.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime(),
                    to.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime(),
                    PageRequest.of(page, size, Sort.by(sortDir, sortBy))));
        } catch (Exception e) {
            log.error("Error listando orden compra: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    private final StereumService stereumService;
    private final SistemaB2B sistemaB2B;
    private final UsuarioService usuarioService;
    private final ProveedorService proveedorService;
    private final EmpresaService empresaService;
    @Autowired
    private SimpMessagingTemplate template;

    @PostMapping
    public ResponseEntity<OrdenCompraDTO> save(@RequestBody OrdenCompraRequest dto) {
        UUID idempotency = UUID.randomUUID();
        try {
            OrdenCompraDTO created = ordenCompraService.save(dto, idempotency);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            log.error("Error creando orden compra: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrdenCompraDTO> update(@PathVariable UUID id, @RequestBody OrdenCompraRequest dto) {
        try {
            return ordenCompraService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando orden compra: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return ordenCompraService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Error eliminando orden compra: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
