package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Factura;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class FacturaDTO {
    private UUID id;
    private Instant fecha;
    private BigDecimal total;
    private String idEstado;
    private UUID idOrdenId;
    private OrdenCompraDTO idOrden;

    public FacturaDTO(Factura factura) {
        this.id = factura.getId();
        this.fecha = factura.getFecha();
        this.total = factura.getTotal();
        this.idEstado = factura.getIdEstado();
        this.idOrden = new OrdenCompraDTO(factura.getIdOrden());
    }

    public FacturaDTO(UUID id, Instant fecha, BigDecimal total, String idEstado, UUID idOrdenId) {
        this.id = id;
        this.fecha = fecha;
        this.total = total;
        this.idEstado = idEstado;
        this.idOrdenId = idOrdenId;
    }

    public FacturaDTO(UUID id, Instant fecha, BigDecimal total, String idEstado, OrdenCompra idOrden) {
        this.id = id;
        this.fecha = fecha;
        this.total = total;
        this.idEstado = idEstado;
        this.idOrden = new OrdenCompraDTO(idOrden);
    }
}
