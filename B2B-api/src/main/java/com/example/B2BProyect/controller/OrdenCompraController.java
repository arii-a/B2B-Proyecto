package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.*;
import com.example.B2BProyect.repository.dto.request.OrdenCompraRequest;
import com.example.B2BProyect.repository.dto.response.OrdenCompraDTO;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.*;
import com.example.B2BProyect.service.exception.OperationException;
import org.springframework.data.domain.*;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@RestController
@RequestMapping("/api/v1/ordenes-compra")
public class OrdenCompraController {
    private final OrdenCompraService ordenCompraService;

    /*@GetMapping
    public ResponseEntity<List<OrdenCompraDTO>> findAll() {
        try {
            return ResponseEntity.ok(ordenCompraService.findAll());
        } catch (Exception e) {
            log.error("Error listando orden compra: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }*/

    @GetMapping
    public ResponseEntity<Page<OrdenCompraDTO>> findAll(@RequestParam(value = "page", defaultValue = "0") Integer page, @RequestParam(value = "size", defaultValue = "10") Integer size, @RequestParam(value = "sortBy", defaultValue = "id") String sortBy) {
        Usuario user = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.info(user.getIdRol().getNombre());
        try {
            return ResponseEntity.ok(ordenCompraService.findAllDTO(page,size,sortBy));
        } catch (OperationException e) {
            log.error("Error llamando a las ordenes: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error llamando a las ordenes", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al listar ordenes");
        }
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<OrdenCompraDTO>> findAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(ordenCompraService.findAllPaged(page, size));
        } catch (Exception e) {
            log.error("Error listando ordenes compra paginadas: {}", e.getMessage());
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

    @GetMapping("/idOrden")
    public ResponseEntity<PageImpl<OrdenCompraDTO>> findById(
            @RequestParam UUID idOrden,
            @RequestParam(value = "page", defaultValue = "0") Integer page,
            @RequestParam(value = "size", defaultValue = "10") Integer size,
            @RequestParam(value = "sortBy", defaultValue = "id") String sortBy) {
        try {
            return ordenCompraService.findByIdDTO(idOrden)
                    .map(dto -> new PageImpl<>(List.of(dto), PageRequest.of(page, size, Sort.by(sortBy)), 1))
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error buscando orden compra: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Error al buscar la orden");
        }
    }


}
