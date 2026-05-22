package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.TarifaReglaDTO;
import com.example.B2BProyect.repository.entity.TarifaRegla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TarifaReglaRepository extends JpaRepository<TarifaRegla, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.TarifaReglaDTO(" +
            "tr.id, tr.nombre, tr.descripcion, tr.activo, tr.idProveedor.idEmpresa.nombre) " +
            "FROM TarifaRegla tr WHERE tr.idProveedor.idEmpresa.nombre = :pNombre")
    List<TarifaReglaDTO> findByProveedorDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.TarifaReglaDTO(" +
            "tr.id, tr.nombre, tr.descripcion, tr.activo, tr.idProveedor.idEmpresa.nombre)" +
            " FROM TarifaRegla tr")
    List<TarifaReglaDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.TarifaReglaDTO(" +
            "tr.id, tr.nombre, tr.descripcion, tr.activo, tr.idProveedor.idEmpresa.nombre)" +
            " FROM TarifaRegla tr WHERE tr.id = :pId")
    Optional<TarifaReglaDTO> findByIdDTO(@Param("pId") UUID pId);
}