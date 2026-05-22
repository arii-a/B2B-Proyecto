package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.dto.response.ProveedorDTO;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.Proveedor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProveedorRepository extends JpaRepository<Proveedor, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProveedorDTO(p.id, p.activo, p.idEmpresa.nombre) " +
            "FROM Proveedor p WHERE p.idEmpresa.nombre = :pNombre")
    Optional<ProveedorDTO> findByNameDTO(@Param("pNombre") String pNombre);

    // mando solo el nombre de la empresa para que al listar todos los proveedores no salga información extra
    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.ProveedorDTO(p.id, p.activo, p.idEmpresa.nombre)" +
            " FROM Proveedor p")
    List<ProveedorDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProveedorDTO(p.id, p.activo, p.idEmpresa.nombre)" +
            " FROM Proveedor p WHERE p.id=:pId")
    Optional<ProveedorDTO> findByIdDTO(@Param("pId") UUID pId);
}