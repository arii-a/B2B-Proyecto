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
@Table(name = "tramo_tarifa", indexes = {
        @Index(name = "idx_tramo_regla", columnList = "id_regla")
})
public class TramoTarifa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_tramo", nullable = false)
    private UUID id;

    @Column(name = "tipo", nullable = false, length = 20)
    private String tipo;

    @Column(name = "cantidad_minima", nullable = false, precision = 14, scale = 2)
    private BigDecimal cantidadMinima;

    @Column(name = "cantidad_maxima", precision = 14, scale = 2)
    private BigDecimal cantidadMaxima;

    @Column(name = "porcentaje_desc", nullable = false, precision = 14, scale = 2)
    private BigDecimal porcentajeDesc;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_regla", nullable = false)
    private TarifaRegla idRegla;

}