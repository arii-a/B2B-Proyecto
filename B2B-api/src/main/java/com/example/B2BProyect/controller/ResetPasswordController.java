package com.example.B2BProyect.controller;

import com.example.B2BProyect.service.UsuarioService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/auth")
public class ResetPasswordController {
    private final UsuarioService usuarioService;

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank())
            return ResponseEntity.badRequest().body(Map.of("error", "El correo es requerido"));
        boolean found = usuarioService.resetPassword(email.trim());
        if (!found)
            return ResponseEntity.status(404).body(Map.of("error", "No existe una cuenta con ese correo"));
        return ResponseEntity.ok(Map.of("message", "Se envió una contraseña temporal a tu correo"));
    }
}
