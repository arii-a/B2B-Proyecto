package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_orden", nullable = false)
    private OrdenCompra idOrden;

    @ColumnDefault("pendiente")
    @Column(name = "id_estado", nullable = false, length = 20)
    private String idEstado;

    @OneToMany(mappedBy = "idFactura")
    private Set<DetalleFactura> detalleFacturas = new LinkedHashSet<>();

}