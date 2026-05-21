package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
public class TarifaReglaDTO {
    private UUID id;
    private String nombre;
    private String descripcion;
    private boolean activo;
    private UUID idProveedor;
}
