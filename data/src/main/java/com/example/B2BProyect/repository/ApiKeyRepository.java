package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApiKeyRepository extends JpaRepository<ApiKey, UUID> {

    @Query("SELECT k FROM ApiKey k WHERE k.keyHash = :pHash")
    Optional<ApiKey> findByKeyHash(@Param("pHash") String pHash);

    @Query("SELECT k FROM ApiKey k WHERE k.idUsuario.id = :pUsuarioId")
    List<ApiKey> findByUsuarioId(@Param("pUsuarioId") UUID pUsuarioId);
}
