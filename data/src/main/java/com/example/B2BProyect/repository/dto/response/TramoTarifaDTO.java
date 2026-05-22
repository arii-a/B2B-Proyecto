package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.TarifaRegla;
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
    private String nombreRegla;
    private TarifaReglaDTO idRegla;

    public TramoTarifaDTO(TramoTarifa tramo) {
        this.id = tramo.getId();
        this.tipo = tramo.getTipo();
        this.cantidadMinima = tramo.getCantidadMinima();
        this.cantidadMaxima = tramo.getCantidadMaxima();
        this.porcentajeDesc = tramo.getPorcentajeDesc();
        this.idRegla = new TarifaReglaDTO(tramo.getIdRegla());
    }

    public TramoTarifaDTO(UUID id, String tipo, BigDecimal cantidadMinima, BigDecimal cantidadMaxima,
                           BigDecimal porcentajeDesc, String nombreRegla) {
        this.id = id;
        this.tipo = tipo;
        this.cantidadMinima = cantidadMinima;
        this.cantidadMaxima = cantidadMaxima;
        this.porcentajeDesc = porcentajeDesc;
        this.nombreRegla = nombreRegla;
    }

    public TramoTarifaDTO(UUID id, String tipo, BigDecimal cantidadMinima, BigDecimal cantidadMaxima,
                           BigDecimal porcentajeDesc, TarifaRegla idRegla) {
        this.id = id;
        this.tipo = tipo;
        this.cantidadMinima = cantidadMinima;
        this.cantidadMaxima = cantidadMaxima;
        this.porcentajeDesc = porcentajeDesc;
        this.idRegla = new TarifaReglaDTO(idRegla);
    }
}
