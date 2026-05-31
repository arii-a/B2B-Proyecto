package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class TramoTarifaRequest {
    private String tipo;
    private BigDecimal cantidadMinima;
    private BigDecimal cantidadMaxima;
    private BigDecimal porcentajeDesc;
    private UUID idRegla;
}
