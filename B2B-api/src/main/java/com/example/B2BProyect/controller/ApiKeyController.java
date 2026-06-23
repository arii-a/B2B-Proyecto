package com.example.B2BProyect.controller;

import com.example.B2BProyect.repository.dto.request.ApiKeyRequest;
import com.example.B2BProyect.repository.dto.response.ApiKeyCreatedDTO;
import com.example.B2BProyect.repository.dto.response.ApiKeyDTO;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.ApiKeyService;
import com.example.B2BProyect.service.exception.NotDataFoundException;
import com.example.B2BProyect.service.exception.OperationException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Controller
@RequestMapping("/api/v1/api-keys")
public class ApiKeyController {

    private final ApiKeyService apiKeyService;

    @PostMapping
    public ResponseEntity<ApiKeyCreatedDTO> create(
            @AuthenticationPrincipal Usuario usuario,
            @RequestBody ApiKeyRequest request) {
        try {
            ApiKeyCreatedDTO created = apiKeyService.create(usuario.getId(), request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (NotDataFoundException e) {
            log.error("Error creando API Key: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (OperationException e) {
            log.error("Error creando API Key: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, e.getMessage());
        } catch (Exception e) {
            log.error("Error creando API Key", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al crear la API Key");
        }
    }

    @GetMapping
    public ResponseEntity<List<ApiKeyDTO>> findAll(@AuthenticationPrincipal Usuario usuario) {
        try {
            return ResponseEntity.ok(apiKeyService.findByUsuario(usuario.getId()));
        } catch (Exception e) {
            log.error("Error listando API Keys", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al listar las API Keys");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> revoke(
            @AuthenticationPrincipal Usuario usuario,
            @PathVariable UUID id) {
        try {
            apiKeyService.revoke(id, usuario.getId());
            return ResponseEntity.noContent().build();
        } catch (NotDataFoundException e) {
            log.error("Error revocando API Key: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        } catch (OperationException e) {
            log.error("Error revocando API Key: {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, e.getMessage());
        } catch (Exception e) {
            log.error("Error revocando API Key", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Se generó un error genérico al revocar la API Key");
        }
    }
}
