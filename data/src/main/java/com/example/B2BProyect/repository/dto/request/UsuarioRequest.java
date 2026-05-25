package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class UsuarioRequest {
    private String nombre;
    private String email;
    private Boolean activo;
    private UUID idEmpresa;
    private UUID idSucursal;
    private UUID idRol;
}
