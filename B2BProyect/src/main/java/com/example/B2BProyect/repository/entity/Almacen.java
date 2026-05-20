package com.example.B2BProyect.repository.entity;

import com.example.B2BProyect.repository.entity.DetalleOrden;
import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import com.example.B2BProyect.repository.entity.Proveedor;
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
@Table(name = "almacen", indexes = {
        @Index(name = "idx_almacen_proveedor", columnList = "id_proveedor")
})
public class Almacen {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_almacen", nullable = false)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "direccion")
    private String direccion;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor id_proveedor;

    @OneToMany(mappedBy = "id_almacen")
    private Set<DetalleOrden> detalleOrdens = new LinkedHashSet<>();
    @OneToMany(mappedBy = "id_almacen")
    private Set<ProductoAlmacen> productoAlmacens = new LinkedHashSet<>();

/*
 TODO [Reverse Engineering] create field to map the 'coordenadas' column
 Available actions: Define target Java type | Uncomment as is | Remove column mapping
    @Column(name = "coordenadas", columnDefinition = "point")
    private Object coordenadas;
*/
}