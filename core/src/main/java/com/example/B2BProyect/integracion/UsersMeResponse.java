package com.example.B2BProyect.integracion;

import java.time.LocalDateTime;

public record UsersMeResponse(
        String id,
        String nombre,
        String apellido,
        String email,
        String username,
        String telefono,
        String tipo,
        LocalDateTime createdAt
) {

}
