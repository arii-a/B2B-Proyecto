package com.example.B2BProyect.controller;

import com.example.B2BProyect.config.JwtTokenProvider;
import com.example.B2BProyect.repository.dto.OKAuthDto;
import com.example.B2BProyect.repository.dto.request.AuthenticationDTO;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.UsuarioService;
import lombok.extern.slf4j.Slf4j;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.springframework.http.ResponseEntity.ok;

@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/v1/auth/login")
public class AuthController {
    private final JwtTokenProvider jwtTokenProvider;
    private final UsuarioService userService;
    private final AuthenticationManager authenticationManager;


    @PostMapping()
    public ResponseEntity<?> token(
            @RequestBody AuthenticationDTO data) {
        try {
            OKAuthDto token = auth(data);
            return ok(token);
        } catch (BadCredentialsException e) {
            log.error("Error BadCredentialsException al autenticar", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Error al autenticar");
        } catch (Exception e) {
            log.error("Error al autentificar el usuario: {}", data.email(), e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,"Error al autenticar");
        }
    }


    public OKAuthDto auth(AuthenticationDTO data)  {
        String email = data.email();
        log.info("Getting user email: {}", email);
        Usuario user;
        try {
            Optional<Usuario> userOptional = userService.findByEmailToValidateSession(email);
            if (userOptional.isEmpty()) {
                throw new BadCredentialsException("Email o contraseña son incorrectos");
            }
            user = userOptional.get();
        } catch (Exception e) {
            log.error("No se encontró el usuario con correo " + email + " Registrado en la base de datos");
            throw new BadCredentialsException("Email o contraseña son incorrectos");
        }

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(data.email(), data.passwordHash()));
            log.info("Autenticado correctamente");
            SecurityContextHolder.getContext().
                    setAuthentication(new UsernamePasswordAuthenticationToken(user, "", user.getAuthorities()));
            return jwtTokenProvider.createToken(user);
        } catch (BadCredentialsException e) {
            log.error("BadCredentialsException. Causa:{} ", e.getMessage());
            throw new BadCredentialsException("Email o contraseña son incorrectos");
        } catch (AuthenticationException e) {
            log.error("AuthenticationException. Causa:{}", e.getMessage());
            throw new BadCredentialsException("Email o contraseña son incorrectos");
        } catch (Exception e) {
            log.error("Error de autentificacion: ", e);
            throw e;
        }
    }

}
