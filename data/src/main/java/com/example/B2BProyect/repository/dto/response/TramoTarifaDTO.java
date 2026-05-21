package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
public class TramoTarifaDTO {
    private UUID id;
    private String tipo;
    private BigDecimal cantidadMinima;
    private BigDecimal cantidadMaxima;
    private BigDecimal porcentajeDesc;
    private UUID idRegla;
}
