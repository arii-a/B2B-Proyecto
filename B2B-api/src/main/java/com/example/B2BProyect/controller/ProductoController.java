package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.exception.OperationException;
import com.example.B2BProyect.repository.dto.request.ProductoRequest;
import com.example.B2BProyect.repository.dto.response.ProductoDTO;
import com.example.B2BProyect.service.ProductoService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
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
@RequestMapping("/api/v1/products")
public class ProductoController {
    private final ProductoService productoService;

    @GetMapping
    public ResponseEntity<List<ProductoDTO>> findAll() {
        try {
            return ResponseEntity.ok(productoService.findAll());
        } catch (OperationException e) {
            log.error("Error al listar productos: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error al listar productos", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al listar productos");
        }
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<ProductoDTO>> findAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            return ResponseEntity.ok(productoService.findAllPaged(page, size));
        } catch (Exception e) {
            log.error("Error al listar productos paginados: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/proveedor/{idProveedor}")
    public ResponseEntity<List<ProductoDTO>> findByProveedor(@PathVariable UUID idProveedor) {
        try {
            return ResponseEntity.ok(productoService.findByProveedor(idProveedor));
        } catch (OperationException e) {
            log.error("Error listando productos por proveedor: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error listando productos por proveedor", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al listar productos por proveedor");
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ProductoRequest producto) {
        try {
            productoService.save(producto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (OperationException e) {
            log.error("Error al guardar producto: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error al guardar producto", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al guardar producto");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductoDTO> update(@PathVariable UUID id, @RequestBody ProductoRequest dto) {
        try {
            return productoService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (OperationException e) {
            log.error("Error actualizando producto: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error actualizando producto", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al actualizar producto");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        try {
            return productoService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (OperationException e) {
            log.error("Error eliminando producto: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error eliminando producto", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al eliminar producto");
        }
    }
}
