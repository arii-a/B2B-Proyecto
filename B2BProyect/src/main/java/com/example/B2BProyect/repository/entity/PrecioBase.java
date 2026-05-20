package com.example.B2BProyect.repository.entity;

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
@Table(name = "precio_base", indexes = {
        @Index(name = "idx_precio_proveedor", columnList = "id_proveedor"),
        @Index(name = "idx_precio_id_producto", columnList = "id_producto")
})
public class PrecioBase {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_precio", nullable = false)
    private UUID id;

    @Column(name = "precio_base", nullable = false, precision = 14, scale = 2)
    private BigDecimal precio_base;

    @Column(name = "vigente_desde", nullable = false)
    private Instant vigente_desde;

    @Column(name = "vigente_hasta")
    private Instant vigente_hasta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor id_proveedor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_producto", nullable = false)
    private Producto id_producto;

}