package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO;
import com.example.B2BProyect.repository.entity.ContratoEmpresaTarifa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContratoEmpresaTarifaRepository extends JpaRepository<ContratoEmpresaTarifa, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO(" +
            "ct.id, ct.vigenteDesde, ct.vigenteHasta, ct.activo, " +
            "ct.idEmpresa.nombre, ct.idProveedor.idEmpresa.nombre, ct.idRegla.nombre) " +
            "FROM ContratoEmpresaTarifa ct WHERE ct.idEmpresa.nombre = :pNombre")
    List<ContratoEmpresaTarifasDTO> findByEmpresaDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO(" +
            "ct.id, ct.vigenteDesde, ct.vigenteHasta, ct.activo, " +
            "ct.idEmpresa.nombre, ct.idProveedor.idEmpresa.nombre, ct.idRegla.nombre) " +
            "FROM ContratoEmpresaTarifa ct WHERE ct.idProveedor.idEmpresa.nombre = :pNombre")
    List<ContratoEmpresaTarifasDTO> findByProveedorDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO(" +
            "ct.id, ct.vigenteDesde, ct.vigenteHasta, ct.activo," +
            " ct.idEmpresa.nombre, ct.idProveedor.idEmpresa.nombre, ct.idRegla.nombre)" +
            " FROM ContratoEmpresaTarifa ct")
    List<ContratoEmpresaTarifasDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ContratoEmpresaTarifasDTO(" +
            "ct.id, ct.vigenteDesde, ct.vigenteHasta, ct.activo, " +
            "ct.idEmpresa.nombre, ct.idProveedor.idEmpresa.nombre, ct.idRegla.nombre)" +
            " FROM ContratoEmpresaTarifa ct WHERE ct.id = :pId")
    Optional<ContratoEmpresaTarifasDTO> findByIdDTO(@Param("pId") UUID pId);
}