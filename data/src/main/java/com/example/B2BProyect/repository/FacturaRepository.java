package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.FacturaDTO;
import com.example.B2BProyect.repository.entity.Factura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FacturaRepository extends JpaRepository<Factura, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.FacturaDTO(" +
            "f.id, f.fecha, f.total, f.idEstado, f.idOrden.id) " +
            "FROM Factura f WHERE f.idOrden.id = :pIdOrden")
    List<FacturaDTO> findByOrdenDTO(@Param("pIdOrden") UUID pIdOrden);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.FacturaDTO(f.id, f.fecha, f.total, f.idEstado, f.idOrden.id)" +
            " FROM Factura f")
    List<FacturaDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.FacturaDTO(f.id, f.fecha, f.total, f.idEstado, f.idOrden.id)" +
            " FROM Factura f WHERE f.id = :pId")
    Optional<FacturaDTO> findByIdDTO(@Param("pId") UUID pId);
}