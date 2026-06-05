package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ReglasComisionRequest {
    private String nombre;
    private String idTipo;
    private BigDecimal valor;
    private Boolean activa;
    private Instant fechaInicio;
    private Instant fechaFinal;
    private UUID idProveedor;
}
