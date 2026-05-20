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
@Table(name = "usuario", indexes = {
        @Index(name = "idx_usuario_empresa", columnList = "id_empresa"),
        @Index(name = "idx_usuario_sucursal", columnList = "id_sucursal"),
        @Index(name = "idx_usuario_rol", columnList = "id_rol")
}, uniqueConstraints = {
        @UniqueConstraint(name = "usuario_email_key", columnNames = {"email"})
})
public class Usuario {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_usuario", nullable = false)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private Empresa idEmpresa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_sucursal", nullable = false)
    private SucursalEmpresa idSucursal;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_rol", nullable = false)
    private RolUsuario idRol;

    @OneToMany(mappedBy = "idUsuario")
    private Set<OrdenCompra> ordenCompras = new LinkedHashSet<>();

}