package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@AllArgsConstructor
public class FacturaDTO {
    private UUID id;
    private LocalDate fecha;
    private BigDecimal total;
    private UUID idOrden;
    private UUID idEstado;
}
