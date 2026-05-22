package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.ContratoEmpresaDetalle;
import com.example.B2BProyect.repository.entity.ContratoEmpresaTarifa;
import com.example.B2BProyect.repository.entity.Producto;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class ContratoEmpresaDetalleDTO {
    private UUID id;
    private BigDecimal porcentajeDescuento;
    private String nombreProducto;
    private String nombreContrato;
    private ProductoDTO idProducto;
    private ContratoEmpresaTarifasDTO idContrato;

    public ContratoEmpresaDetalleDTO(ContratoEmpresaDetalle detalle) {
        this.id = detalle.getId();
        this.porcentajeDescuento = detalle.getPorcentajeDescuento();
        this.idProducto = new ProductoDTO(detalle.getIdProducto());
        this.idContrato = new ContratoEmpresaTarifasDTO(detalle.getIdContrato());
    }

    public ContratoEmpresaDetalleDTO(UUID id, BigDecimal porcentajeDescuento,
                                      String nombreProducto, String nombreContrato) {
        this.id = id;
        this.porcentajeDescuento = porcentajeDescuento;
        this.nombreProducto = nombreProducto;
        this.nombreContrato = nombreContrato;
    }

    public ContratoEmpresaDetalleDTO(UUID id, BigDecimal porcentajeDescuento,
                                      Producto idProducto, ContratoEmpresaTarifa idContrato) {
        this.id = id;
        this.porcentajeDescuento = porcentajeDescuento;
        this.idProducto = new ProductoDTO(idProducto);
        this.idContrato = new ContratoEmpresaTarifasDTO(idContrato);
    }
}
