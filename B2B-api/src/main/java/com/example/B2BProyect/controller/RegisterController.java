package com.example.B2BProyect.controller;

import com.example.B2BProyect.config.JwtTokenProvider;
import com.example.B2BProyect.repository.dto.OKAuthDto;
import com.example.B2BProyect.repository.dto.request.RegisterRequest;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.RegisterService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/auth/register")
public class RegisterController {

    private final RegisterService registerService;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping
    public ResponseEntity<OKAuthDto> register(@RequestBody RegisterRequest request) {
        try {
            Usuario usuario = registerService.register(request);
            OKAuthDto token = jwtTokenProvider.createToken(usuario);
            return ResponseEntity.ok(token);
        } catch (Exception e) {
            log.error("Error al registrar empresa: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }
}
