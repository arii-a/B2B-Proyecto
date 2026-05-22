package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.CategoriaDTO;
import com.example.B2BProyect.repository.entity.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoriaRepository extends JpaRepository<Categoria, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.CategoriaDTO(c.id, c.nombre, c.descripcion) " +
            "FROM Categoria c WHERE c.nombre = :pNombre")
    Optional<CategoriaDTO> findByNameDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.CategoriaDTO(c.id, c.nombre, c.descripcion)" +
            " FROM Categoria c")
    List<CategoriaDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.CategoriaDTO(c.id, c.nombre, c.descripcion)" +
            " FROM Categoria c WHERE c.id = :pId")
    Optional<CategoriaDTO> findByIdDTO(@Param("pId") UUID pId);
}