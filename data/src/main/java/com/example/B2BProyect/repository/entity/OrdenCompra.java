package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "orden_compra", indexes = {
        @Index(name = "idx_orden_fecha", columnList = "fecha"),
        @Index(name = "idx_orden_proveedor", columnList = "id_proveedor"),
        @Index(name = "idx_orden_empresa", columnList = "id_empresa_compradora"),
        @Index(name = "idx_orden_sucursal", columnList = "id_sucursal"),
        @Index(name = "idx_orden_usuario", columnList = "id_usuario"),
        @Index(name = "idx_orden_estado", columnList = "id_estado")
})
public class OrdenCompra {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_orden", nullable = false)
    private UUID id;

    @Column(name = "total", nullable = false, precision = 14, scale = 2)
    private BigDecimal total;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "fecha")
    private Instant fecha;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor idProveedor;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa_compradora", nullable = false)
    private Empresa idEmpresaCompradora;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_sucursal", nullable = false)
    private SucursalEmpresa idSucursal;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario idUsuario;

    @ColumnDefault("pendiente")
    @Column(name = "id_estado", nullable = false, length = 20)
    private String idEstado;

    @Column(name = "fecha_orden")
    private LocalDate fechaOrden;

    @OneToMany(mappedBy = "idOrden")
    private Set<DetalleOrden> detalleOrdens = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idOrden")
    private Set<Factura> facturas = new LinkedHashSet<>();

}