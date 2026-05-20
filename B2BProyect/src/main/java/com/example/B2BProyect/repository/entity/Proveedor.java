package com.example.B2BProyect.repository.entity;

import com.example.B2BProyect.repository.entity.Almacen;
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
@Table(name = "proveedor")
public class Proveedor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_proveedor", nullable = false)
    private UUID id;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private Empresa id_empresa;

    @OneToMany(mappedBy = "id_proveedor")
    private Set<Almacen> almacens = new LinkedHashSet<>();

    @OneToMany(mappedBy = "id_proveedor")
    private Set<Comision> comisions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "id_proveedor")
    private Set<ContratoEmpresaTarifa> contratoEmpresaTarifas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "id_proveedor")
    private Set<OrdenCompra> ordenCompras = new LinkedHashSet<>();

    @OneToMany(mappedBy = "id_proveedor")
    private Set<PrecioBase> precio_bases = new LinkedHashSet<>();

    @OneToMany(mappedBy = "id_proveedor")
    private Set<ReglasComision> reglasComisions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "id_proveedor")
    private Set<TarifaRegla> tarifaReglas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "id_proveedor")
    private Set<Producto> productos = new LinkedHashSet<>();

}