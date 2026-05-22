package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO;
import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import com.example.B2BProyect.repository.entity.ProductoAlmacenId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProductoAlmacenRepository extends JpaRepository<ProductoAlmacen, ProductoAlmacenId> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO(" +
            "pa.id.idAlmacen, pa.id.idProducto, pa.stock, pa.max, pa.min, pa.activo, " +
            "pa.almacen.nombre, pa.producto.nombre) " +
            "FROM ProductoAlmacen pa WHERE pa.id.idAlmacen = :pIdAlmacen")
    List<ProductoAlmacenDTO> findByAlmacenDTO(@Param("pIdAlmacen") UUID pIdAlmacen);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO(" +
            "pa.id.idAlmacen, pa.id.idProducto, pa.stock, pa.max, pa.min, pa.activo, " +
            "pa.almacen.nombre, pa.producto.nombre) " +
            "FROM ProductoAlmacen pa WHERE pa.almacen.nombre = :pNombreAlmacen")
    List<ProductoAlmacenDTO> findByAlmacenNombreDTO(@Param("pNombreAlmacen") String pNombreAlmacen);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO(" +
            "pa.id.idAlmacen, pa.id.idProducto, pa.stock, pa.max, pa.min, pa.activo, " +
            "pa.almacen.nombre, pa.producto.nombre) " +
            "FROM ProductoAlmacen pa WHERE pa.id.idProducto = :pIdProducto")
    List<ProductoAlmacenDTO> findByProductoDTO(@Param("pIdProducto") UUID pIdProducto);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO(" +
            "pa.id.idAlmacen, pa.id.idProducto, pa.stock, pa.max, pa.min, pa.activo, " +
            "pa.almacen.nombre, pa.producto.nombre) " +
            "FROM ProductoAlmacen pa WHERE pa.producto.nombre = :pNOmbreProducto")
    List<ProductoAlmacenDTO> findByProductoNombreDTO(@Param("pNOmbreProducto") String pNOmbreProducto);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.ProductoAlmacenDTO(" +
            "pa.id.idAlmacen, pa.id.idProducto, pa.stock, pa.max, pa.min, pa.activo," +
            " pa.almacen.nombre, pa.producto.nombre)" +
            " FROM ProductoAlmacen pa")
    List<ProductoAlmacenDTO> findAllDTO();
}