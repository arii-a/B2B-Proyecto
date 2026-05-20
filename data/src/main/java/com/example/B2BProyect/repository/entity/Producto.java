package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "producto", indexes = {
        @Index(name = "idx_producto_nombre", columnList = "nombre"),
        @Index(name = "idx_producto_activo", columnList = "activo"),
        @Index(name = "idx_producto_categoria", columnList = "id_categoria")
})
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_producto", nullable = false)
    private UUID id;

    @Column(name = "sku", length = 100)
    private String sku;

    @Column(name = "nombre", nullable = false, length = 200)
    private String nombre;

    @Column(name = "descripcion", length = Integer.MAX_VALUE)
    private String descripcion;

    @Column(name = "unidad_medida", length = 50)
    private String unidadMedida;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_categoria")
    private Categoria idCategoria;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_proveedor")
    private Proveedor idProveedor;

    @OneToMany(mappedBy = "idProducto")
    private Set<ContratoEmpresaDetalle> contratoEmpresaDetalles = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProducto")
    private Set<DetalleFactura> detalleFacturas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProducto")
    private Set<DetalleOrden> detalleOrdens = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProducto")
    private Set<PrecioBase> precioBases = new LinkedHashSet<>();

    @OneToMany(mappedBy = "producto")
    private Set<ProductoAlmacen> productoAlmacens = new LinkedHashSet<>();
}