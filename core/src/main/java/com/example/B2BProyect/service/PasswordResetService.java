package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.PasswordResetTokensRepository;
import com.example.B2BProyect.repository.entity.PasswordResetToken;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private final PasswordResetTokensRepository passwordResetTokensRepository;
    private final UsuarioService usuarioService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void requestReset(String email) {
        usuarioService.findByEmail(email).orElseThrow(() -> new RuntimeException("No existe una cuenta con ese correo"));
        passwordResetTokensRepository.deleteByEmail(email);
        PasswordResetToken token = new PasswordResetToken();
        String code = String.format("%06d", new SecureRandom().nextInt(999999));
        token.setEmail(email);
        token.setCode(code);
        token.setUsed(false);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15).toInstant(ZoneOffset.UTC));
        passwordResetTokensRepository.save(token);
        emailService.sendPasswordResetCode(email, code);
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        PasswordResetToken token = passwordResetTokensRepository
                .findByEmailAndCodeAndUsedFalse(email, code)
                .orElseThrow(() -> new RuntimeException("Código inválido o ya utilizado"));
        if (token.getExpiresAt().isBefore(LocalDateTime.now().toInstant(ZoneOffset.UTC)))
            throw new RuntimeException("El código ha expirado");
        Usuario usuario = usuarioService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        usuario.setPasswordHash(passwordEncoder.encode(newPassword));
        usuarioService.saveComplete(usuario);
        token.setUsed(true);
        passwordResetTokensRepository.save(token);
    }
}
