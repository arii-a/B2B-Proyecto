package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.DetalleOrden;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class DetalleOrdenDTO {
    private UUID id;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private UUID idOrden;
    private UUID idProducto;
    private UUID idAlmacen;

    public DetalleOrdenDTO(DetalleOrden d) {
        this.id = d.getId();
        this.cantidad = d.getCantidad();
        this.precioUnitario = d.getPrecioUnitario();
        this.subtotal = d.getSubtotal();
        this.idOrden = d.getIdOrden().getId();
        this.idProducto = d.getIdProducto().getId();
        this.idAlmacen = d.getAlmacen().getId();
    }
}
