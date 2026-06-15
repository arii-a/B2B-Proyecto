package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.exception.OperationException;
import com.example.B2BProyect.repository.dto.request.ProductoAlmacenRequest;
import com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO;
import com.example.B2BProyect.repository.entity.ProductoAlmacenId;
import com.example.B2BProyect.service.ProductoAlmacenService;
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
@RequestMapping("/api/v1/producto-almacen")
public class ProductoAlmacenController {
    private final ProductoAlmacenService productoAlmacenService;

    @GetMapping
    public ResponseEntity<List<ProductoAlmacenDTO>> findAll() {
        try {
            return ResponseEntity.ok(productoAlmacenService.findAll());
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error listando producto-almacén: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @GetMapping("/almacen/{idAlmacen}")
    public ResponseEntity<List<ProductoAlmacenDTO>> findByAlmacen(@PathVariable UUID idAlmacen) {
        try {
            return ResponseEntity.ok(productoAlmacenService.findByAlmacen(idAlmacen));
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error listando producto-almacén por almacén: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody ProductoAlmacenRequest dto) {
        try {
            productoAlmacenService.save(dto);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error creando producto-almacén: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @PutMapping("/{idAlmacen}/{idProducto}")
    public ResponseEntity<ProductoAlmacenDTO> update(@PathVariable UUID idAlmacen,
                                                      @PathVariable UUID idProducto,
                                                      @RequestBody ProductoAlmacenRequest dto) {
        try {
            ProductoAlmacenId id = new ProductoAlmacenId();
            id.setIdAlmacen(idAlmacen);
            id.setIdProducto(idProducto);
            return productoAlmacenService.update(id, dto)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error actualizando producto-almacén: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }

    @DeleteMapping("/{idAlmacen}/{idProducto}")
    public ResponseEntity<Void> delete(@PathVariable UUID idAlmacen,
                                       @PathVariable UUID idProducto) {
        try {
            ProductoAlmacenId id = new ProductoAlmacenId();
            id.setIdAlmacen(idAlmacen);
            id.setIdProducto(idProducto);
            return productoAlmacenService.delete(id)
                    ? ResponseEntity.noContent().build()
                    : ResponseEntity.notFound().build();
        } catch (OperationException e) {
            log.error("OperationException: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error eliminando producto-almacén: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico");
        }
    }
}
