package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "sucursal_empresa", indexes = {
        @Index(name = "idx_sucursal_empresa", columnList = "id_empresa")
})
public class SucursalEmpresa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_sucursal", nullable = false)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "direccion")
    private String direccion;

    @Column(name = "coordenadas", precision = 14, scale = 5)
    private BigDecimal coordenadas;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private Empresa idEmpresa;

    @OneToMany(mappedBy = "idSucursal")
    private Set<OrdenCompra> ordenCompras = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idSucursal")
    private Set<Usuario> usuarios = new LinkedHashSet<>();

}