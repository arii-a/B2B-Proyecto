package com.example.B2BProyect.repository.entity;

import com.example.B2BProyect.repository.enums.LogLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UuidGenerator;

@Builder
@NoArgsConstructor
@AllArgsConstructor

@Entity
@Table(name = "log")
public class Log extends AuditableEntity {
    @Id
    @UuidGenerator
    private String id;

    @Column(name = "_level", length = 10)
    @Enumerated(EnumType.STRING)
    private LogLevel level;

    @Column(name = "descripcion", length = 4000, comment = "Almacena el mensaje del log")
    private String descripcion;

}
