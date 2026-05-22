package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO;
import com.example.B2BProyect.repository.entity.ContratoEmpresaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContratoEmpresaDetalleRepository extends JpaRepository<ContratoEmpresaDetalle, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO(" +
            "cd.id, cd.porcentajeDescuento, cd.idProducto.nombre, cd.idContrato.idRegla.nombre) " +
            "FROM ContratoEmpresaDetalle cd WHERE cd.idContrato.id = :pIdContrato")
    List<ContratoEmpresaDetalleDTO> findByContratoDTO(@Param("pIdContrato") UUID pIdContrato);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO(" +
            "cd.id, cd.porcentajeDescuento, cd.idProducto.nombre, cd.idContrato.idRegla.nombre)" +
            " FROM ContratoEmpresaDetalle cd")
    List<ContratoEmpresaDetalleDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ContratoEmpresaDetalleDTO(" +
            "cd.id, cd.porcentajeDescuento, cd.idProducto.nombre, cd.idContrato.idRegla.nombre)" +
            " FROM ContratoEmpresaDetalle cd WHERE cd.id = :pId")
    Optional<ContratoEmpresaDetalleDTO> findByIdDTO(@Param("pId") UUID pId);

}