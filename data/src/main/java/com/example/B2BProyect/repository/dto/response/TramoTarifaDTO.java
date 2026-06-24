package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.TramoTarifa;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class TramoTarifaDTO {
    private UUID id;
    private String tipo;
    private BigDecimal cantidadMinima;
    private BigDecimal cantidadMaxima;
    private BigDecimal porcentajeDesc;
    private String tipoDescuento;
    private BigDecimal montoFijo;
    private UUID idContrato;

    public TramoTarifaDTO(TramoTarifa tramo) {
        this.id = tramo.getId();
        this.tipo = tramo.getTipo();
        this.cantidadMinima = tramo.getCantidadMinima();
        this.cantidadMaxima = tramo.getCantidadMaxima();
        this.porcentajeDesc = tramo.getPorcentajeDesc();
        this.tipoDescuento = tramo.getTipoDescuento() != null ? tramo.getTipoDescuento() : "porcentaje";
        this.montoFijo = tramo.getMontoFijo();
        this.idContrato = tramo.getIdContrato() != null ? tramo.getIdContrato().getId() : null;
    }
}
