package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class SucursalEmpresaRequest {
    private String nombre;
    private String direccion;
    private String coordenadas;
    private Boolean activo;
    private UUID idEmpresa;
}
