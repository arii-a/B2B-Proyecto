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
public class PrecioBaseRequest {
    private BigDecimal precioBase;
    private Instant vigenteDesde;
    private Instant vigenteHasta;
    private UUID idProveedor;
    private UUID idProducto;
}
