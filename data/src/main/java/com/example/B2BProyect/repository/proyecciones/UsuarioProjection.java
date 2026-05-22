package com.example.B2BProyect.repository.proyecciones;

import java.util.UUID;

public interface UsuarioProjection {
    UUID getId();
    String getNombre();
    String getEmail();
    Boolean getActivo();
}
