package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.DetalleFactura;
import com.example.B2BProyect.repository.entity.Factura;
import com.example.B2BProyect.repository.entity.Producto;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class DetalleFacturaDTO {
    private UUID id;
    private Integer cantidad;
    private BigDecimal precioUnitario;
    private BigDecimal subtotal;
    private String nombreProducto;
    private UUID idFacturaId;
    private ProductoDTO idProducto;
    private FacturaDTO idFactura;

    public DetalleFacturaDTO(DetalleFactura detalle) {
        this.id = detalle.getId();
        this.cantidad = detalle.getCantidad();
        this.precioUnitario = detalle.getPrecioUnitario();
        this.subtotal = detalle.getSubtotal();
        this.idProducto = new ProductoDTO(detalle.getIdProducto());
        this.idFactura = new FacturaDTO(detalle.getIdFactura());
    }

    public DetalleFacturaDTO(UUID id, Integer cantidad, BigDecimal precioUnitario, BigDecimal subtotal,
                              String nombreProducto, UUID idFacturaId) {
        this.id = id;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
        this.nombreProducto = nombreProducto;
        this.idFacturaId = idFacturaId;
    }

    public DetalleFacturaDTO(UUID id, Integer cantidad, BigDecimal precioUnitario, BigDecimal subtotal,
                              Producto idProducto, Factura idFactura) {
        this.id = id;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
        this.idProducto = new ProductoDTO(idProducto);
        this.idFactura = new FacturaDTO(idFactura);
    }
}
