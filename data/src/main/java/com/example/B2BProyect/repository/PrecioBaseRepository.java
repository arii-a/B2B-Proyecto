package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.PrecioBaseDTO;
import com.example.B2BProyect.repository.entity.PrecioBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PrecioBaseRepository extends JpaRepository<PrecioBase, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.PrecioBaseDTO(" +
            "pb.id, pb.precioBase, pb.vigenteDesde, pb.vigenteHasta, " +
            "pb.idProveedor.idEmpresa.nombre, pb.idProducto.nombre) " +
            "FROM PrecioBase pb WHERE pb.idProveedor.idEmpresa.nombre = :pNombre")
    List<PrecioBaseDTO> findByProveedorDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.PrecioBaseDTO(" +
            "pb.id, pb.precioBase, pb.vigenteDesde, pb.vigenteHasta, " +
            "pb.idProveedor.idEmpresa.nombre, pb.idProducto.nombre) " +
            "FROM PrecioBase pb WHERE pb.idProducto.nombre = :pNombre")
    List<PrecioBaseDTO> findByProductoDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.PrecioBaseDTO(" +
            "pb.id, pb.precioBase, pb.vigenteDesde, pb.vigenteHasta," +
            " pb.idProveedor.idEmpresa.nombre, pb.idProducto.nombre)" +
            " FROM PrecioBase pb")
    List<PrecioBaseDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.PrecioBaseDTO(" +
            "pb.id, pb.precioBase, pb.vigenteDesde, pb.vigenteHasta, " +
            "pb.idProveedor.idEmpresa.nombre, pb.idProducto.nombre)" +
            " FROM PrecioBase pb WHERE pb.id = :pId")
    Optional<PrecioBaseDTO> findByIdDTO(@Param("pId") UUID pId);
}