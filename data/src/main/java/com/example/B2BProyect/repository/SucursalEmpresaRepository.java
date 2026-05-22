package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO;
import com.example.B2BProyect.repository.entity.SucursalEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SucursalEmpresaRepository extends JpaRepository<SucursalEmpresa, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO(" +
            "se.id, se.nombre, se.direccion, se.coordenadas, se.activo, se.idEmpresa.nombre) " +
            "FROM SucursalEmpresa se WHERE se.idEmpresa.nombre = :pNombre")
    List<SucursalEmpresaDTO> findByEmpresaDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO(" +
            "se.id, se.nombre, se.direccion, se.coordenadas, se.activo, se.idEmpresa.nombre)" +
            " FROM SucursalEmpresa se")
    List<SucursalEmpresaDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO(" +
            "se.id, se.nombre, se.direccion, se.coordenadas, se.activo, se.idEmpresa.nombre)" +
            " FROM SucursalEmpresa se WHERE se.id = :pId")
    Optional<SucursalEmpresaDTO> findByIdDTO(@Param("pId") UUID pId);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.SucursalEmpresaDTO(" +
            "se.id, se.nombre, se.direccion, se.coordenadas, se.activo, se.idEmpresa.nombre)" +
            " FROM SucursalEmpresa se WHERE se.nombre = :pSucursal")
    Optional<SucursalEmpresaDTO> findByNombreDTO(@Param("pSucursal") String pSucursal);
}