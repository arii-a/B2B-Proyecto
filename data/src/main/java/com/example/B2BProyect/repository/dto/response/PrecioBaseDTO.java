package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@AllArgsConstructor
public class PrecioBaseDTO {
    private UUID id;
    private BigDecimal precioBase;
    private LocalDate vigenteDesde;
    private LocalDate vigenteHasta;
    private UUID idProveedor;
    private UUID idProducto;
}
