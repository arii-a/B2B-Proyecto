package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.UnidadMedida;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface UnidadMedidaRepository extends JpaRepository<UnidadMedida, UUID> {
    List<UnidadMedida> findAllByActivoTrue();
}
