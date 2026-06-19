package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.PasswordResetTokensRepository;
import com.example.B2BProyect.repository.entity.Usuario;
import lombok.AllArgsConstructor;
import com.example.B2BProyect.repository.entity.PasswordResetToken;
import lombok.Data;
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
    public void requestReset(String email){
        usuarioService.findByEmail(email).orElseThrow(() -> new RuntimeException("Negativo"));
        passwordResetTokensRepository.deleteByEmail(email);
        PasswordResetToken token = new PasswordResetToken();
        String code = String.format("%06d", new SecureRandom().nextInt(999999));
        token.setEmail(email);
        token.setCode(code);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(15).toInstant(ZoneOffset.UTC));
        passwordResetTokensRepository.save(token);

        emailService.sendPasswordResetCode(email, code);
    }

    @Transactional
    public void resetPassword(String email, String code, String newPassword){
        PasswordResetToken passwordResetToken = passwordResetTokensRepository.
                findByEmailAndCodeAndUsedFalse(email, code).
                orElseThrow(() -> new RuntimeException("una excepcion"));
        if (passwordResetToken.getExpiresAt().isBefore(LocalDateTime.now().toInstant(ZoneOffset.UTC))){
            throw new RuntimeException("SE HA EXPIRADO");
        }
        Usuario usuario = usuarioService.findByEmail(email).orElseThrow(()->new RuntimeException("No existe"));
        usuario.setPasswordHash(passwordEncoder.encode(newPassword));
        usuarioService.saveComplete(usuario);

        passwordResetToken.setUsed(true);
        passwordResetTokensRepository.save(passwordResetToken);
    }

}
