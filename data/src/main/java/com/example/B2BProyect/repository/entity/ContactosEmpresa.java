package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "contactos_empresa", indexes = {
        @Index(name = "idx_contactos_cargo", columnList = "id_cargo_empresa"),
        @Index(name = "idx_contactos_empresa", columnList = "id_empresa")
})
public class ContactosEmpresa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_contacto_empresa", nullable = false)
    private UUID id;

    @Column(name = "nombres", nullable = false, length = 150)
    private String nombres;

    @Column(name = "apellidos", nullable = false, length = 150)
    private String apellidos;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_cargo_empresa", nullable = false)
    private CargoEmpresa idCargoEmpresa;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private Empresa idEmpresa;

}