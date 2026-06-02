package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.entity.Materia;
import com.example.B2BProyect.repository.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MateriaRepository extends JpaRepository<Materia, UUID> {
    @Query("SELECT m FROM Materia m WHERE m.nombre = :pNombre")
    Optional<Materia> findByNombre(@Param("pNombre") String pNombre);

    @Query("SELECT m FROM Materia m WHERE m.nombre = :pSigla")
    Optional<Materia> findBySigla(@Param("pSigla") String pSigla);

}