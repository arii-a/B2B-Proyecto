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
@Table(name = "tarifa_regla", indexes = {
        @Index(name = "idx_tarifaregla_proveedor", columnList = "id_proveedor")
})
public class TarifaRegla {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_tarifa", nullable = false)
    private UUID id;

    @Column(name = "nombre", length = 250)
    private String nombre;

    @Column(name = "descripcion", length = Integer.MAX_VALUE)
    private String descripcion;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor idProveedor;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @OneToMany(mappedBy = "idRegla")
    private Set<ContratoEmpresaTarifa> contratoEmpresaTarifas = new LinkedHashSet<>();

    @OneToMany(mappedBy = "idRegla")
    private Set<TramoTarifa> tramoTarifas = new LinkedHashSet<>();

}