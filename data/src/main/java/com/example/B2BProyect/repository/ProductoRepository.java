package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ProductoDTO;
import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.repository.proyecciones.ProductoProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductoRepository extends JpaRepository<Producto, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.unidadMedida, p.activo, " +
            "p.idCategoria.nombre, p.idProveedor.idEmpresa.nombre) " +
            "FROM Producto p WHERE p.sku = :pSku")
    Optional<ProductoDTO> findBySkuDTO(@Param("pSku") String pSku);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.unidadMedida, p.activo," +
            " p.idCategoria.nombre, p.idProveedor.idEmpresa.nombre)" +
            " FROM Producto p")
    List<ProductoDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.unidadMedida, p.activo, " +
            "p.idCategoria.nombre, p.idProveedor.idEmpresa.nombre)" +
            " FROM Producto p WHERE p.id = :pId")
    Optional<ProductoDTO> findByIdDTO(@Param("pId") UUID pId);

    // proyección por interfaz: para catálogo y búsquedas
    @Query("SELECT p.id AS id, p.sku AS sku, p.nombre AS nombre, p.activo AS activo FROM Producto p")
    List<ProductoProjection> findResumenProductos();

}