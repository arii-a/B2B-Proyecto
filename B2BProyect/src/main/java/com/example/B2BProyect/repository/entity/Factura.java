package com.example.B2BProyect.repository.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "factura", indexes = {
        @Index(name = "idx_factura_orden", columnList = "id_orden"),
        @Index(name = "idx_factura_estado", columnList = "id_estado")
})
public class Factura {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_factura", nullable = false)
    private UUID id;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "fecha", nullable = false)
    private Instant fecha;

    @Column(name = "total", nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_orden", nullable = false)
    private OrdenCompra id_orden;

    @ColumnDefault("pendiente")
    @Column(name = "id_estado", nullable = false, length = 20)
    private String id_estado;

    @OneToMany(mappedBy = "id_factura")
    private Set<DetalleFactura> detalleFacturas = new LinkedHashSet<>();

}