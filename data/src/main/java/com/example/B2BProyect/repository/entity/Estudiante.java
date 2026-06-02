package com.example.B2BProyect.repository.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.util.UUID;

@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "estudiante")
public class Estudiante {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_estudiante", nullable = false)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 150)
    private String apellido;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_materia", nullable = false)
    private Materia idMateria;

    @Column(name = "nota", nullable = false, length = 150)
    private Integer nota;

    @Column(name = "nro_telefono", nullable = false, length = 150)
    private String nroTelefono;

    @Column(name = "nro_documento", nullable = false, length = 150)
    private String nroDocumento;

    public void setIdMateria(Materia materia) {
    }
}
