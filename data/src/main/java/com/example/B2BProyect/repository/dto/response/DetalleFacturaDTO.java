package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.util.UUID;

@AllArgsConstructor
public class DetalleFacturaDTO {
    private UUID id;
    private int cantidad;
    private double precioUnitario;
    private double subtotal;
    private UUID idFactura;
    private UUID idProducto;
}
