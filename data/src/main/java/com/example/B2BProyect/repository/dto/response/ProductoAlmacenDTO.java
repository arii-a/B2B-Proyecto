package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
public class ProductoAlmacenDTO {
    private UUID idAlmacen;
    private UUID idProducto;
    private int stock;
    private BigDecimal max;
    private BigDecimal min;
    private boolean activo;
}
