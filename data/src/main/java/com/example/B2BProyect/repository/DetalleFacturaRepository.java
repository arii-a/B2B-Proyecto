package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO;
import com.example.B2BProyect.repository.entity.DetalleFactura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DetalleFacturaRepository extends JpaRepository<DetalleFactura, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO(" +
            "df.id, df.cantidad, df.precioUnitario, df.subtotal, df.idProducto.nombre, df.idFactura.id) " +
            "FROM DetalleFactura df WHERE df.idFactura.id = :pIdFactura")
    List<DetalleFacturaDTO> findByFacturaDTO(@Param("pIdFactura") UUID pIdFactura);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO(" +
            "df.id, df.cantidad, df.precioUnitario, df.subtotal, df.idProducto.nombre, df.idFactura.id)" +
            " FROM DetalleFactura df")
    List<DetalleFacturaDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO(" +
            "df.id, df.cantidad, df.precioUnitario, df.subtotal, df.idProducto.nombre, df.idFactura.id)" +
            " FROM DetalleFactura df WHERE df.idProducto.id = :pId")
    Optional<DetalleFacturaDTO> findByIdProductoDTO(@Param("pId") UUID pId);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.DetalleFacturaDTO(" +
            "df.id, df.cantidad, df.precioUnitario, df.subtotal, df.idProducto.nombre, df.idFactura.id)" +
            " FROM DetalleFactura df WHERE df.idProducto.nombre = :pNOmbre")
    Optional<DetalleFacturaDTO> findByProductoDTO(@Param("pNOmbre") String pNOmbre);
}