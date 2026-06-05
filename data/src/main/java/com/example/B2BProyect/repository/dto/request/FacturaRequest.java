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
public class FacturaRequest {
    private Instant fecha;
    private BigDecimal total;
    private String idEstado;
    private UUID idOrden;
}
