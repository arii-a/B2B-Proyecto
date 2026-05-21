package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
public class SucursalEmpresaDTO {
    private UUID id;
    private String nombre;
    private String direccion;
    private BigDecimal coordenadas;
    private boolean activo;
    private UUID idEmpresa;
}
