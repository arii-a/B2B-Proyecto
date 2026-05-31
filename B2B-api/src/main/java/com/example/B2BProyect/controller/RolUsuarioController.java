package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.RolUsuarioRequest;
import com.example.B2BProyect.repository.dto.response.RolUsuarioDTO;
import com.example.B2BProyect.service.RolUsuarioService;
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
@RequestMapping("/api/v1/roles-usuario")
public class RolUsuarioController {
    private final RolUsuarioService rolUsuarioService;

    @GetMapping
    public ResponseEntity<List<RolUsuarioDTO>> findAll() {
        try {
            return ResponseEntity.ok(rolUsuarioService.findAll());
        } catch (Exception e) {
            log.error("Error llamando a los roles de usuario: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping
    public ResponseEntity<Void> save(@RequestBody RolUsuarioRequest rolUsuario) {
        try {
            rolUsuarioService.save(rolUsuario);
            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            log.error("Error creando nuevo rol de usuario: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}
