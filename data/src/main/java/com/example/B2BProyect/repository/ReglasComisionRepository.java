package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ReglasComisionDTO;
import com.example.B2BProyect.repository.entity.ReglasComision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReglasComisionRepository extends JpaRepository<ReglasComision, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ReglasComisionDTO(" +
            "rc.id, rc.nombre, rc.idTipo, rc.valor, rc.activa, " +
            "rc.fechaInicio, rc.fechaFinal, rc.idProveedor.idEmpresa.nombre) " +
            "FROM ReglasComision rc WHERE rc.idProveedor.idEmpresa.nombre = :pNombre")
    List<ReglasComisionDTO> findByProveedorDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.ReglasComisionDTO(" +
            "rc.id, rc.nombre, rc.idTipo, rc.valor, rc.activa," +
            " rc.fechaInicio, rc.fechaFinal, rc.idProveedor.idEmpresa.nombre)" +
            " FROM ReglasComision rc")
    List<ReglasComisionDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ReglasComisionDTO(" +
            "rc.id, rc.nombre, rc.idTipo, rc.valor, rc.activa, " +
            "rc.fechaInicio, rc.fechaFinal, rc.idProveedor.idEmpresa.nombre)" +
            " FROM ReglasComision rc WHERE rc.id = :pId")
    Optional<ReglasComisionDTO> findByIdDTO(@Param("pId") UUID pId);
}