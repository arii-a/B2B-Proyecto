package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "reglas_comision", indexes = {
        @Index(name = "idx_reglacomision_nombre", columnList = "nombre"),
        @Index(name = "idx_reglacomision_proveedor", columnList = "id_proveedor")
})
public class ReglasComision {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_regla", nullable = false)
    private UUID id;

    @Column(name = "nombre", length = 150)
    private String nombre;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor idProveedor;

    @Column(name = "id_tipo", nullable = false, length = 20)
    private String idTipo;

    @Column(name = "valor", nullable = false, precision = 14, scale = 2)
    private BigDecimal valor;

    @ColumnDefault("true")
    @Column(name = "activa", nullable = false)
    private Boolean activa = false;

    @Column(name = "fecha_inicio")
    private Instant fechaInicio;

    @Column(name = "fecha_final")
    private Instant fechaFinal;

    @OneToMany(mappedBy = "idReglaComision")
    private Set<Comision> comisions = new LinkedHashSet<>();

}