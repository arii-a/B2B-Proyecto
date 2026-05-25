package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.RolUsuarioRepository;
import com.example.B2BProyect.repository.SucursalEmpresaRepository;
import com.example.B2BProyect.repository.dto.request.UsuarioRequest;
import com.example.B2BProyect.repository.dto.response.UsuarioDTO;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.UsuarioService;
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
@Controller
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;
    private final EmpresaRepository empresaRepository;
    private final SucursalEmpresaRepository sucursalRepository;
    private final RolUsuarioRepository rolRepository;

    @GetMapping
    public ResponseEntity<List<Usuario>> findAll() {
        try {
            return ResponseEntity.ok(usuarioService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los usuarios: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Usuario> save(@RequestBody Usuario usuario) {
        try {
            usuarioService.save(usuario);
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
                    .map(u -> ResponseEntity.ok(new UsuarioDTO(u)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error actualizando usuario: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
