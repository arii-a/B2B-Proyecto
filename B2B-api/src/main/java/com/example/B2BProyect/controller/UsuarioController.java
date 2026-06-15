package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.dto.request.UsuarioRequest;
import com.example.B2BProyect.repository.dto.response.UsuarioDTO;
import com.example.B2BProyect.service.UsuarioService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;
    private final EmpresaRepository empresaRepository;
    private final SucursalEmpresaRepository sucursalRepository;
    private final RolUsuarioRepository rolRepository;

    /*@GetMapping
    public ResponseEntity<List<UsuarioDTO>> findAll() {
        try {
            return ResponseEntity.ok(usuarioService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los usuarios: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }*/

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody UsuarioRequest dto) {
        try {
            usuarioService.save(dto, empresaRepository, sucursalRepository, rolRepository);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo usuario: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioDTO> update(@PathVariable UUID id,
                                             @RequestBody UsuarioRequest dto) {
        try {
            return usuarioService.update(id, dto,
                            empresaRepository, sucursalRepository, rolRepository)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando usuario: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping()
    public ResponseEntity<Page<UsuarioDTO>> logs(@RequestParam(value = "page", defaultValue = "0") Integer page,
                                                 @RequestParam(value = "size", defaultValue = "10") Integer size,
                                                 @RequestParam(value = "sortBy", defaultValue = "createdDate") String sortBy,
                                                 @RequestParam(value = "sortDir", defaultValue = "DESC") Sort.Direction sortDir,

                                                 @RequestParam("from") @DateTimeFormat(pattern = "yyyy-MM-dd") Date from,
                                                 @RequestParam("to") @DateTimeFormat(pattern = "yyyy-MM-dd") Date to) {

        try {
            return ResponseEntity.ok(usuarioService.findAllByOrderByDateDesc(from.toInstant()
                            .atZone(ZoneId.systemDefault()).toLocalDateTime(),
                    to.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime(),

                    PageRequest.of(page, size, Sort.by(sortDir, sortBy)))
            );
        } catch (Exception e) {
            log.error("Error al listar el inventario de activos", e);
            return ResponseEntity.badRequest().build();
        }
    }
}
