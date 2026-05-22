package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.AlmacenDTO;
import com.example.B2BProyect.repository.dto.response.ProveedorDTO;
import com.example.B2BProyect.repository.entity.Almacen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AlmacenRepository extends JpaRepository<Almacen, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.AlmacenDTO(a.id, a.nombre, a.direccion, a.coordenadas, " +
            "a.activo, a.idProveedor.idEmpresa.nombre) " +
            "FROM Almacen a WHERE a.idProveedor.idEmpresa.nombre = :pNombre")
    Optional<AlmacenDTO> findByNameDTO(@Param("pNombre") String pNombre);

    // mando solo el nombre de la empresa para que al listar todos los proveedores no salga información extra
    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.AlmacenDTO(a.id, a.nombre, a.direccion, a.coordenadas, " +
            "a.activo, a.idProveedor.idEmpresa.nombre) " +
            " FROM Almacen a")
    List<AlmacenDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.AlmacenDTO(a.id, a.nombre, a.direccion, a.coordenadas, " +
            "a.activo, a.idProveedor.idEmpresa.nombre) " +
            " FROM Almacen a WHERE a.id=:pId")
    Optional<AlmacenDTO> findByIdDTO(@Param("pId") UUID pId);
}