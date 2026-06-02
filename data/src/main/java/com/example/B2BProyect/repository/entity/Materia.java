package com.example.B2BProyect.repository.entity;


import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "materia")
public class Materia {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_materia", nullable = false)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 150)
    private String nombre;

    @Column(name = "sigla", nullable = false, length = 150)
    private String sigla;

    @OneToMany(mappedBy = "idMateria")
    private Set<Estudiante> estudiantes = new LinkedHashSet<>();

    public Materia(Materia materia) {
        this.id = materia.getId();
        this.nombre = materia.getNombre();
        this.sigla = materia.getSigla();
    }

    public Materia(UUID id, String nombre, String sigla) {
        this.id = id;
        this.nombre = nombre;
        this.sigla = sigla;
    }

    public Materia(UUID id) {
        this.id = id;
    }
}
