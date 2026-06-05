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
public class ComisionRequest {
    private BigDecimal montoComision;
    private BigDecimal montoProveedor;
    private Instant fecha;
    private UUID idDetalleOrden;
    private UUID idProveedor;
    private UUID idReglaComision;
}
