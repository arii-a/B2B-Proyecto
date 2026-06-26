package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ProductoDTO;
import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.repository.proyecciones.ProductoProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProductoRepository extends JpaRepository<Producto, UUID> {
    @Query("SELECT new com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.activo, " +
            "c.nombre, e.nombre, u.nombre) " +
            "FROM Producto p " +
            "LEFT JOIN p.idCategoria c " +
            "LEFT JOIN p.idProveedor pr LEFT JOIN pr.idEmpresa e " +
            "LEFT JOIN p.idUnidadMedida u " +
            "WHERE p.sku = :pSku")
    Optional<ProductoDTO> findBySkuDTO(@Param("pSku") String pSku);

    @Query("SELECT new com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.activo, " +
            "c.nombre, e.nombre, u.nombre) " +
            "FROM Producto p " +
            "LEFT JOIN p.idCategoria c " +
            "LEFT JOIN p.idProveedor pr LEFT JOIN pr.idEmpresa e " +
            "LEFT JOIN p.idUnidadMedida u")
    List<ProductoDTO> findAllDTO();

    @Query("SELECT new com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.activo, " +
            "c.nombre, e.nombre, u.nombre) " +
            "FROM Producto p " +
            "LEFT JOIN p.idCategoria c " +
            "LEFT JOIN p.idProveedor pr LEFT JOIN pr.idEmpresa e " +
            "LEFT JOIN p.idUnidadMedida u " +
            "WHERE p.id = :pId")
    Optional<ProductoDTO> findByIdDTO(@Param("pId") UUID pId);

    // proyección por interfaz: para catálogo y búsquedas
    @Query("SELECT p.id AS id, p.sku AS sku, p.nombre AS nombre, p.activo AS activo FROM Producto p")
    List<ProductoProjection> findResumenProductos();

    @Query(value = "SELECT new com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.activo, " +
            "c.nombre, e.nombre, u.nombre) " +
            "FROM Producto p " +
            "LEFT JOIN p.idCategoria c " +
            "LEFT JOIN p.idProveedor pr LEFT JOIN pr.idEmpresa e " +
            "LEFT JOIN p.idUnidadMedida u " +
            "ORDER BY p.id DESC",
            countQuery = "SELECT COUNT(p) FROM Producto p")
    Page<ProductoDTO> findAllPaged(Pageable pageable);

    @Query(value = "SELECT new com.example.B2BProyect.repository.dto.response.ProductoDTO(" +
            "p.id, p.sku, p.nombre, p.descripcion, p.activo, " +
            "c.nombre, e.nombre, u.nombre) " +
            "FROM Producto p " +
            "LEFT JOIN p.idCategoria c " +
            "LEFT JOIN p.idProveedor pr LEFT JOIN pr.idEmpresa e " +
            "LEFT JOIN p.idUnidadMedida u " +
            "WHERE LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) " +
            "ORDER BY p.id DESC",
            countQuery = "SELECT COUNT(p) FROM Producto p WHERE LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%'))")
    Page<ProductoDTO> findAllPagedByNombre(@Param("nombre") String nombre, Pageable pageable);

    List<Producto> findByIdProveedorId(UUID idProveedor);

}
