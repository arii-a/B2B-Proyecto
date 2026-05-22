package com.example.B2BProyect.repository.entity;

import com.example.B2BProyect.repository.entity.Almacen;
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

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private Empresa idEmpresa;

    @OneToMany(mappedBy = "idProveedor")
    private Set<Almacen> almacens = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProveedor")
    private Set<Comision> comisions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProveedor")
    private Set<ContratoEmpresaTarifa> contratoEmpresaTarifas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProveedor")
    private Set<OrdenCompra> ordenCompras = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProveedor")
    private Set<PrecioBase> precioBases = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProveedor")
    private Set<ReglasComision> reglasComisions = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProveedor")
    private Set<TarifaRegla> tarifaReglas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idProveedor")
    private Set<Producto> productos = new LinkedHashSet<>();

}