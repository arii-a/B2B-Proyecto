package com.example.B2BProyect.repository;

import com.example.B2BProyect.repository.dto.response.OrdenCompraDTO;
import com.example.B2BProyect.repository.dto.response.OrdenCompraResumenDTO;
import com.example.B2BProyect.repository.dto.response.ProductoDTO;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import com.example.B2BProyect.repository.proyecciones.OrdenCompraProjection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrdenCompraRepository extends JpaRepository<OrdenCompra, UUID> {
    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.OrdenCompraDTO(" +
            "o.id, o.total, o.fecha, o.fechaOrden, o.idEstado, " +
            "o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre, " +
            "o.idSucursal.nombre, o.idUsuario.nombre) " +
            "FROM OrdenCompra o WHERE o.idProveedor.idEmpresa.nombre = :pNombre")
    List<OrdenCompraDTO> findByProveedorDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.OrdenCompraDTO(" +
            "o.id, o.total, o.fecha, o.fechaOrden, o.idEstado, " +
            "o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre, " +
            "o.idSucursal.nombre, o.idUsuario.nombre) " +
            "FROM OrdenCompra o WHERE o.idEmpresaCompradora.nombre = :pNombre")
    List<OrdenCompraDTO> findByEmpresaDTO(@Param("pNombre") String pNombre);

    @Query("SELECT new" +
            " com.example.B2BProyect.repository.dto.response.OrdenCompraDTO(" +
            "o.id, o.total, o.fecha, o.fechaOrden, o.idEstado," +
            " o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre," +
            " o.idSucursal.nombre, o.idUsuario.nombre)" +
            " FROM OrdenCompra o")
    List<OrdenCompraDTO> findAllDTO();

    @Query("SELECT new " +
            "com.example.B2BProyect.repository.dto.response.OrdenCompraDTO(" +
            "o.id, o.total, o.fecha, o.fechaOrden, o.idEstado, " +
            "o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre, " +
            "o.idSucursal.nombre, o.idUsuario.nombre)" +
            " FROM OrdenCompra o WHERE o.id = :pId")
    Optional<OrdenCompraDTO> findByIdDTO(@Param("pId") UUID pId);

    @Query("SELECT o FROM OrdenCompra o WHERE o.idEmpresaCompradora.id = :idEmpresa")
    List<OrdenCompra> findByEmpresaCompradora(@Param("idEmpresa") UUID idEmpresa);

    @Query("SELECT o FROM OrdenCompra o WHERE o.idProveedor.idEmpresa.id = :idEmpresa")
    List<OrdenCompra> findByProveedorEmpresa(@Param("idEmpresa") UUID idEmpresa);
// proyección para listar resumen de órdenes
    @Query("SELECT o.id AS id, o.fecha AS fecha, o.idEstado AS idEstado, o.total AS total FROM OrdenCompra o")
    List<OrdenCompraProjection> findResumenOrdenes();

    @Query("SELECT new com.example.B2BProyect.repository.dto.response.OrdenCompraDTO(" +
            "o.id, o.total, o.fecha, o.fechaOrden, o.idEstado, " +
            "o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre, " +
            "o.idSucursal.nombre, o.idUsuario.nombre) " +
            "FROM OrdenCompra o WHERE o.createdDate BETWEEN :pInit AND :pEnd")
    Page<OrdenCompraDTO> findAllByOrderByDateDesc(
            @Param("pInit") LocalDateTime pInit,
            @Param("pEnd") LocalDateTime pEnd,
            Pageable pageable);



    @Query("SELECT new com.example.B2BProyect.repository.dto.response.OrdenCompraDTO(" +
            "o.id, o.total, o.fecha, o.fechaOrden, o.idEstado, " +
            "o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre, " +
            "o.idSucursal.nombre, o.idUsuario.nombre) " +
            "FROM OrdenCompra o")
    Page<OrdenCompraDTO> findAllPaged(Pageable pageable);




    @Query("SELECT o FROM OrdenCompra o WHERE o.idEstado = 'pendiente' AND o.createdDate <= :limite")
    List<OrdenCompra> findPendientesVencidas(@Param("limite") LocalDateTime limite);

    @Query("SELECT new com.example.B2BProyect.repository.dto.response.OrdenCompraResumenDTO(" +
            "o.id, o.fecha, o.fechaOrden, o.total, o.idEstado, " +
            "o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre, o.idUsuario.nombre, " +
            "o.idProveedor.id, o.idEmpresaCompradora.id, o.idSucursal.id, o.idUsuario.id) " +
            "FROM OrdenCompra o WHERE o.idEmpresaCompradora.id = :idEmpresa")
    Page<OrdenCompraResumenDTO> findByEmpresaCompradoraPaged(@Param("idEmpresa") UUID idEmpresa, Pageable pageable);

    @Query("SELECT new com.example.B2BProyect.repository.dto.response.OrdenCompraResumenDTO(" +
            "o.id, o.fecha, o.fechaOrden, o.total, o.idEstado, " +
            "o.idProveedor.idEmpresa.nombre, o.idEmpresaCompradora.nombre, o.idUsuario.nombre, " +
            "o.idProveedor.id, o.idEmpresaCompradora.id, o.idSucursal.id, o.idUsuario.id) " +
            "FROM OrdenCompra o WHERE o.idProveedor.idEmpresa.id = :idEmpresa")
    Page<OrdenCompraResumenDTO> findByProveedorEmpresaPaged(@Param("idEmpresa") UUID idEmpresa, Pageable pageable);

}