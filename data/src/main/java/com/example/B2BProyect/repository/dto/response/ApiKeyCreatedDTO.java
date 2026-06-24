package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class ApiKeyCreatedDTO {
    private UUID id;
    private String nombre;
    private String key;
    private LocalDateTime expiresAt;
}
