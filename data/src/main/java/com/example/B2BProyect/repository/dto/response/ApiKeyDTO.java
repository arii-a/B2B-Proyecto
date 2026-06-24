package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.ApiKey;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
public class ApiKeyDTO {
    private UUID id;
    private String nombre;
    private Boolean activo;
    private LocalDateTime expiresAt;
    private LocalDateTime createdDate;
    private String createdBy;

    public ApiKeyDTO(ApiKey apiKey) {
        this.id = apiKey.getId();
        this.nombre = apiKey.getNombre();
        this.activo = apiKey.getActivo();
        this.expiresAt = apiKey.getExpiresAt();
        this.createdDate = apiKey.getCreatedDate();
        this.createdBy = apiKey.getCreatedBy();
    }
}
