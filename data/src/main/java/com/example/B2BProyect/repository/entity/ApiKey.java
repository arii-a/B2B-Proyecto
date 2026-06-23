package com.example.B2BProyect.repository.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "api_key", indexes = {
        @Index(name = "idx_api_key_hash", columnList = "key_hash"),
        @Index(name = "idx_api_key_usuario", columnList = "id_usuario")
})
public class ApiKey extends AuditableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id_api_key", nullable = false)
    private UUID id;

    @Column(name = "key_hash", nullable = false, length = 64, unique = true)
    private String keyHash;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @ColumnDefault("true")
    @Column(name = "activo", nullable = false)
    private Boolean activo = true;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id_usuario", nullable = false)
    private Usuario idUsuario;
}
