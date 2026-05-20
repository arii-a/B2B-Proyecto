package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "comision", indexes = {
        @Index(name = "idx_comision_fecha", columnList = "fecha"),
        @Index(name = "idx_comision_proveedor", columnList = "id_proveedor")
}, uniqueConstraints = {
        @UniqueConstraint(name = "comision_id_detalle_orden_key", columnNames = {"id_detalle_orden"})
})
public class Comision {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_comision", nullable = false)
    private UUID id;

    @Column(name = "monto_comision", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoComision;

    @Column(name = "monto_proveedor", nullable = false, precision = 14, scale = 2)
    private BigDecimal montoProveedor;

    @Column(name = "fecha", nullable = false)
    private Instant fecha;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_detalle_orden", nullable = false)
    private DetalleOrden idDetalleOrden;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor idProveedor;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_regla_comision", nullable = false)
    private ReglasComision idReglaComision;

}