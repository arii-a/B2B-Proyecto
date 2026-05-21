package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
public class ContratoEmpresaDetalleDTO {
    private UUID id;
    private BigDecimal porcentajeDescuento;
    private UUID idProducto;
    private UUID idContrato;
}
