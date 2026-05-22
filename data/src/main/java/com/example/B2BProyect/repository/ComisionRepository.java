package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ComisionDTO;
import com.example.B2BProyect.repository.entity.Comision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComisionRepository extends JpaRepository<Comision, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ComisionDTO(c.id, c.montoComision, c.montoProveedor, " +
            "c.fecha, c.idDetalleOrden.id, c.idProveedor.idEmpresa.nombre, c.idReglaComision.nombre) " +
            "FROM Comision c WHERE c.idProveedor.idEmpresa.nombre = :pNombre")
    Optional<ComisionDTO> findProveedorComisionesDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ComisionDTO(c.id, c.montoComision, c.montoProveedor, " +
            "c.fecha, c.idDetalleOrden.id, c.idProveedor.idEmpresa.nombre, c.idReglaComision.nombre) " +
            " FROM Comision c")
    List<ComisionDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ComisionDTO(c.id, c.montoComision, c.montoProveedor, " +
            "c.fecha, c.idDetalleOrden.id, c.idProveedor.idEmpresa.nombre, c.idReglaComision.nombre) " +
            " FROM Comision c WHERE c.idDetalleOrden.id=:pId")
    Optional<ComisionDTO> findByIdOrdenDTO(@Param("pId") UUID pId);
}