package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.TramoTarifaDTO;
import com.example.B2BProyect.repository.entity.TramoTarifa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TramoTarifaRepository extends JpaRepository<TramoTarifa, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.TramoTarifaDTO(" +
            "tt.id, tt.tipo, tt.cantidadMinima, tt.cantidadMaxima, tt.porcentajeDesc, tt.idRegla.nombre) " +
            "FROM TramoTarifa tt WHERE tt.idRegla.id = :pIdRegla")
    List<TramoTarifaDTO> findByReglaDTO(@Param("pIdRegla") UUID pIdRegla);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.TramoTarifaDTO(" +
            "tt.id, tt.tipo, tt.cantidadMinima, tt.cantidadMaxima, tt.porcentajeDesc, tt.idRegla.nombre)" +
            " FROM TramoTarifa tt")
    List<TramoTarifaDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.TramoTarifaDTO(" +
            "tt.id, tt.tipo, tt.cantidadMinima, tt.cantidadMaxima, tt.porcentajeDesc, tt.idRegla.nombre)" +
            " FROM TramoTarifa tt WHERE tt.id = :pId")
    Optional<TramoTarifaDTO> findByIdDTO(@Param("pId") UUID pId);
}