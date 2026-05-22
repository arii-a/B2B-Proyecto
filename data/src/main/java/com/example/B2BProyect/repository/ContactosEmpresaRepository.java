package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ContactosEmpresaDTO;
import com.example.B2BProyect.repository.entity.ContactosEmpresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactosEmpresaRepository extends JpaRepository<ContactosEmpresa, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ContactosEmpresaDTO(" +
            "ce.id, ce.nombres, ce.apellidos, ce.idCargoEmpresa.nombre, ce.idEmpresa.nombre) " +
            "FROM ContactosEmpresa ce WHERE ce.idEmpresa.nombre = :pNombre")
    List<ContactosEmpresaDTO> findByEmpresaDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.ContactosEmpresaDTO(" +
            "ce.id, ce.nombres, ce.apellidos, ce.idCargoEmpresa.nombre, ce.idEmpresa.nombre)" +
            " FROM ContactosEmpresa ce")
    List<ContactosEmpresaDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ContactosEmpresaDTO(" +
            "ce.id, ce.nombres, ce.apellidos, ce.idCargoEmpresa.nombre, ce.idEmpresa.nombre)" +
            " FROM ContactosEmpresa ce WHERE ce.id = :pId")
    Optional<ContactosEmpresaDTO> findByIdDTO(@Param("pId") UUID pId);
}