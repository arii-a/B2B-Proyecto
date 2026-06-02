package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.EstudianteDTO;
import com.example.B2BProyect.repository.dto.response.UsuarioDTO;
import com.example.B2BProyect.repository.entity.Estudiante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EstudianteRepository extends JpaRepository<Estudiante, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.EstudianteDTO(" +
            "e.id, e.nombre, e.apellido, e.nota, e.nroTelefono, e.nroTelefono, e.idMateria.nombre) " +
            "FROM Estudiante e WHERE e.nroDocumento = :pDoc")
    Optional<EstudianteDTO> findByDocumentoDTO(@Param("pDoc") String pDoc);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.EstudianteDTO(" +
            "e.id, e.nombre, e.apellido, e.nota, e.nroTelefono, e.nroTelefono, e.idMateria.nombre) " +
            "FROM Estudiante e WHERE e.id = :pId")
    Optional<EstudianteDTO> findByIdDTO(@Param("pId") UUID pId);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.EstudianteDTO(" +
            "e.id, e.nombre, e.apellido, e.nota, e.nroTelefono, e.nroTelefono, e.idMateria.nombre) " +
            " FROM Estudiante e")
    List<EstudianteDTO> findAllDTO();
}