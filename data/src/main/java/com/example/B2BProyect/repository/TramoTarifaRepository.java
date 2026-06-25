package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.TramoTarifaDTO;
import com.example.B2BProyect.repository.entity.TramoTarifa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface TramoTarifaRepository extends JpaRepository<TramoTarifa, UUID> {

    @Modifying
    @Query("UPDATE TramoTarifa t SET t.idProducto = null WHERE t.idProducto.id = :idProducto")
    void nullifyByIdProducto(@Param("idProducto") UUID idProducto);
}
