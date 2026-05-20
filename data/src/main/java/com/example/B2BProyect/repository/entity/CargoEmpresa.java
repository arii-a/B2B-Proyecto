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
@Table(name = "cargo_empresa")
public class CargoEmpresa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "idCargoEmpresa", nullable = false)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @OneToMany(mappedBy = "idCargoEmpresa")
    private Set<ContactosEmpresa> contactosEmpresas = new LinkedHashSet<>();

}