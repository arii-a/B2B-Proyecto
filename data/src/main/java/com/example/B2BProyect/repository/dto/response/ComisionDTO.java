package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@AllArgsConstructor
public class ComisionDTO {
    private UUID id;
    private BigDecimal montoComision;
    private BigDecimal montoProveedor;
    private LocalDate fecha;
    private UUID idDetalleOrden;
    private UUID idProveedor;
    private UUID idReglaComision;
}
