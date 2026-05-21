package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.util.UUID;

@AllArgsConstructor
public class UsuarioDTO {
    private UUID id;
    private String nombre;
    private String email;
    private String passwordHash;
    private boolean activo;
    private UUID idEmpresa;
    private UUID idSucursal;
    private UUID idRol;
}
