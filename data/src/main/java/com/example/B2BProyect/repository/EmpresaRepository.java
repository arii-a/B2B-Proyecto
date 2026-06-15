package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.EmpresaDTO;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.proyecciones.EmpresaProjection;
import com.example.B2BProyect.repository.proyecciones.EmpresaRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmpresaRepository extends JpaRepository<Empresa, UUID> {
    @Query("SELECT e FROM Empresa e INNER JOIN Proveedor p WHERE e.id = p.idEmpresa.id")
    List<Empresa> listarEmpresasProveedoras();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.EmpresaDTO(e.id, e.nombre, e.dominio, e.nit, e.razonSocial) " +
            "FROM Empresa e WHERE e.nombre=:pNombre")
    Optional<EmpresaDTO> findByNameDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.EmpresaDTO(e.id, e.nombre, e.dominio, e.nit, e.razonSocial)" +
            " FROM Empresa e")
    Page<EmpresaDTO> findAllDTO(Pageable pageable);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.EmpresaDTO(e.id, e.nombre, e.dominio, e.nit, e.razonSocial)" +
            " FROM Empresa e WHERE e.id=:pId")
    Optional<EmpresaDTO> findByIdDTO(@Param("pId") UUID pId);

    // interface
    @Query("SELECT e.id AS id, e.nombre AS nombre, e.nit AS nit FROM Empresa e")
    List<EmpresaProjection> findResumenEmpresas();

    // record
    @Query("SELECT new com.example.B2BProyect.repository.proyecciones.EmpresaRecord(e.id, e.nombre, e.nit, e.razonSocial) FROM Empresa e")
    List<EmpresaRecord> findAllRecord();
}