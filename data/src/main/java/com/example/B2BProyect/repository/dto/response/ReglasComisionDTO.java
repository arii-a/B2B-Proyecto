package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@AllArgsConstructor
public class ReglasComisionDTO {
    private UUID id;
    private String nombre;
    private String idTipo;
    private String idProveedor;
    private BigDecimal valor;
    private boolean activa;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFinal;
}
