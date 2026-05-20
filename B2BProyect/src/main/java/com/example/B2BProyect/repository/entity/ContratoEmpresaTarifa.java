package com.example.B2BProyect.repository.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "contrato_empresa_tarifas", indexes = {
        @Index(name = "idx_contrato_empresa", columnList = "id_empresa"),
        @Index(name = "idx_contrato_proveedor", columnList = "id_proveedor")
})
public class ContratoEmpresaTarifa {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_contrato", nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_empresa", nullable = false)
    private Empresa id_empresa;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_proveedor", nullable = false)
    private Proveedor id_proveedor;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_regla", nullable = false)
    private TarifaRegla id_regla;

    @Column(name = "vigente_desde", nullable = false)
    private Instant vigente_desde;

    @Column(name = "vigente_hasta")
    private Instant vigente_hasta;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = false;

    @OneToMany(mappedBy = "id_contrato")
    private Set<ContratoEmpresaDetalle> contratoEmpresaDetalles = new LinkedHashSet<>();

}