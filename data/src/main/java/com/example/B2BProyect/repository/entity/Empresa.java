package com.example.B2BProyect.repository.entity;

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
@Table(name = "empresa", indexes = {
        @Index(name = "idx_nit_empresa", columnList = "nit")
})
public class Empresa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_empresa", nullable = false)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "dominio", length = 100)
    private String dominio;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @Column(name = "nit", nullable = false, length = 50)
    private String nit;

    @Column(name = "razon_social", nullable = false, length = 200)
    private String razonSocial;

    @OneToMany(mappedBy = "idEmpresa")
    private Set<ContactosEmpresa> contactosEmpresas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idEmpresa")
    private Set<ContratoEmpresaTarifa> contratoEmpresaTarifas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idEmpresaCompradora")
    private Set<OrdenCompra> ordenCompras = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idEmpresa")
    private Set<Proveedor> proveedors = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idEmpresa")
    private Set<SucursalEmpresa> sucursalEmpresas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idEmpresa")
    private Set<Usuario> usuarios = new LinkedHashSet<>();

}