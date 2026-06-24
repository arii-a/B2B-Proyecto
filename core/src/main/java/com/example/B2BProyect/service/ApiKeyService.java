package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.ApiKeyRepository;
import com.example.B2BProyect.repository.UsuarioRepository;
import com.example.B2BProyect.repository.dto.request.ApiKeyRequest;
import com.example.B2BProyect.repository.dto.response.ApiKeyCreatedDTO;
import com.example.B2BProyect.repository.dto.response.ApiKeyDTO;
import com.example.B2BProyect.repository.entity.ApiKey;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.exception.NotDataFoundException;
import com.example.B2BProyect.service.exception.OperationException;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ApiKeyService {

    private final ApiKeyRepository apiKeyRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public ApiKeyCreatedDTO create(UUID usuarioId, ApiKeyRequest request) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new NotDataFoundException("Usuario no encontrado"));

        String rawKey = generateRawKey();
        String keyHash = hash(rawKey);

        ApiKey apiKey = ApiKey.builder()
                .nombre(request.getNombre())
                .keyHash(keyHash)
                .activo(true)
                .expiresAt(request.getExpiresAt())
                .idUsuario(usuario)
                .build();

        ApiKey saved = apiKeyRepository.save(apiKey);
        return new ApiKeyCreatedDTO(saved.getId(), saved.getNombre(), rawKey, saved.getExpiresAt());
    }

    @Transactional(readOnly = true)
    public List<ApiKeyDTO> findByUsuario(UUID usuarioId) {
        return apiKeyRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(ApiKeyDTO::new)
                .toList();
    }

    @Transactional
    public boolean revoke(UUID id, UUID usuarioId) {
        ApiKey apiKey = apiKeyRepository.findById(id)
                .orElseThrow(() -> new NotDataFoundException("API Key no encontrada"));

        if (!apiKey.getIdUsuario().getId().equals(usuarioId)) {
            throw new OperationException("No tiene permiso para revocar esta API Key");
        }

        apiKeyRepository.deleteById(id);
        return true;
    }

    public Usuario validateKey(String rawKey) {
        String keyHash = hash(rawKey);
        ApiKey apiKey = apiKeyRepository.findByKeyHash(keyHash)
                .orElseThrow(() -> new NotDataFoundException("API Key inválida"));

        if (!apiKey.getActivo()) {
            throw new OperationException("API Key desactivada");
        }

        if (apiKey.getExpiresAt() != null && apiKey.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new OperationException("API Key expirada");
        }

        return apiKey.getIdUsuario();
    }

    private String generateRawKey() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return "b2b_" + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hash(String rawKey) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(rawKey.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 no disponible", e);
        }
    }
}
