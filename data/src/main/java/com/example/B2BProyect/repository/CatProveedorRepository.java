package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.CatProveedorDTO;
import com.example.B2BProyect.repository.entity.CatProveedor;
import com.example.B2BProyect.repository.entity.CatProveedorId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CatProveedorRepository extends JpaRepository<CatProveedor, CatProveedorId> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.CatProveedorDTO(" +
            "cp.id.idCategoria, cp.id.idProveedor, cp.idCategoria.nombre, cp.idProveedor.idEmpresa.nombre) " +
            "FROM CatProveedor cp WHERE cp.id.idProveedor = :pIdProveedor")
    List<CatProveedorDTO> findByProveedorDTO(@Param("pIdProveedor") UUID pIdProveedor);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.CatProveedorDTO(" +
            "cp.id.idCategoria, cp.id.idProveedor, cp.idCategoria.nombre, cp.idProveedor.idEmpresa.nombre) " +
            "FROM CatProveedor cp WHERE cp.id.idCategoria = :pIdCategoria")
    List<CatProveedorDTO> findByCategoriaDTO(@Param("pIdCategoria") UUID pIdCategoria);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.CatProveedorDTO(" +
            "cp.id.idCategoria, cp.id.idProveedor, cp.idCategoria.nombre, cp.idProveedor.idEmpresa.nombre)" +
            " FROM CatProveedor cp")
    List<CatProveedorDTO> findAllDTO();
}