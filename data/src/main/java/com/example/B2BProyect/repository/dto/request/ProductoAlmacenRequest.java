package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ProductoAlmacenRequest {
    private UUID idAlmacen;
    private UUID idProducto;
    private Integer stock;
    private BigDecimal max;
    private BigDecimal min;
    private Boolean activo;
}
