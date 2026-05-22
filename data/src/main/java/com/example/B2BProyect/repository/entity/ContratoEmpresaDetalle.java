package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "contrato_empresa_detalle", indexes = {
        @Index(name = "idx_contdetalle_id_producto", columnList = "id_producto"),
        @Index(name = "idx_contdetalle_contrato", columnList = "id_contrato")
})
public class ContratoEmpresaDetalle {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_detalle", nullable = false)
    private UUID id;

    @Column(name = "porcentaje_descuento", nullable = false, precision = 14, scale = 2)
    private BigDecimal porcentajeDescuento;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto idProducto;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_contrato", nullable = false)
    private ContratoEmpresaTarifa idContrato;

}