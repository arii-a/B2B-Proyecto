package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.UsuarioDTO;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.repository.proyecciones.UsuarioProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.UsuarioDTO(" +
            "u.id, u.nombre, u.email, u.activo, u.idEmpresa.nombre, u.idSucursal.nombre, u.idRol.nombre) " +
            "FROM Usuario u WHERE u.email = :pEmail")
    Optional<UsuarioDTO> findByEmailDTO(@Param("pEmail") String pEmail);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.UsuarioDTO(" +
            "u.id, u.nombre, u.email, u.activo, u.idEmpresa.nombre, u.idSucursal.nombre, u.idRol.nombre) " +
            "FROM Usuario u WHERE u.nombre = :pNombre")
    Optional<UsuarioDTO> findByNombrelDTO(@Param("pNombre") String pNombre);

    @Query("SELECT u FROM Usuario u WHERE u.nombre = :pNombre")
    Optional<Usuario> findByNombre(@Param("pNombre") String pNombre);

    @Query("SELECT u FROM Usuario u WHERE u.email = :pEmail")
    Optional<Usuario> findByEmail(@Param("pEmail") String pEmail);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.UsuarioDTO(" +
            "u.id, u.nombre, u.email, u.activo, u.idEmpresa.nombre, u.idSucursal.nombre, u.idRol.nombre)" +
            " FROM Usuario u")
    List<UsuarioDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.UsuarioDTO(" +
            "u.id, u.nombre, u.email, u.activo, u.idEmpresa.nombre, u.idSucursal.nombre, u.idRol.nombre)" +
            " FROM Usuario u WHERE u.id = :pId")
    Optional<UsuarioDTO> findByIdDTO(@Param("pId") UUID pId);

    // proyección para autenticación y sesión
    @Query("SELECT u.id AS id, u.nombre AS nombre, u.email AS email, u.activo AS activo FROM Usuario u")
    List<UsuarioProjection> findResumenUsuarios();

    @Query("SELECT u FROM Usuario u WHERE u.email=:pEmail")
    Optional<Usuario> findByUserEmailToValidateSession(@Param("pEmail") String pEmail);
}