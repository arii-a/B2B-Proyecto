package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class DetalleFacturaRequest {
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private UUID idFactura;
    private UUID idProducto;
}
