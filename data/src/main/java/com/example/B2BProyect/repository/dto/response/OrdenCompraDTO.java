package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
public class OrdenCompraDTO {
    private UUID id;
    private BigDecimal total;
    private Instant fecha;
    private LocalDate fechaOrden;
    private String idEstado;
    private String nombreProveedor;
    private String nombreEmpresaCompradora;
    private String nombreSucursal;
    private String nombreUsuario;
    private ProveedorDTO idProveedor;
    private EmpresaDTO idEmpresaCompradora;
    private SucursalEmpresaDTO idSucursal;
    private UsuarioDTO idUsuario;

    public OrdenCompraDTO(OrdenCompra orden) {
        this.id = orden.getId();
        this.total = orden.getTotal();
        this.fecha = orden.getFecha();
        this.fechaOrden = orden.getFechaOrden();
        this.idEstado = orden.getIdEstado();
        this.idProveedor = new ProveedorDTO(orden.getIdProveedor());
        this.idEmpresaCompradora = new EmpresaDTO(orden.getIdEmpresaCompradora());
        this.idSucursal = new SucursalEmpresaDTO(orden.getIdSucursal());
        this.idUsuario = new UsuarioDTO(orden.getIdUsuario());
    }

    public OrdenCompraDTO(UUID id, BigDecimal total, Instant fecha, LocalDate fechaOrden, String idEstado,
                          String nombreProveedor, String nombreEmpresaCompradora,
                          String nombreSucursal, String nombreUsuario) {
        this.id = id;
        this.total = total;
        this.fecha = fecha;
        this.fechaOrden = fechaOrden;
        this.idEstado = idEstado;
        this.nombreProveedor = nombreProveedor;
        this.nombreEmpresaCompradora = nombreEmpresaCompradora;
        this.nombreSucursal = nombreSucursal;
        this.nombreUsuario = nombreUsuario;
    }

    public OrdenCompraDTO(UUID id, BigDecimal total, Instant fecha, LocalDate fechaOrden, String idEstado,
                          Proveedor idProveedor, Empresa idEmpresaCompradora,
                          SucursalEmpresa idSucursal, Usuario idUsuario) {
        this.id = id;
        this.total = total;
        this.fecha = fecha;
        this.fechaOrden = fechaOrden;
        this.idEstado = idEstado;
        this.idProveedor = new ProveedorDTO(idProveedor);
        this.idEmpresaCompradora = new EmpresaDTO(idEmpresaCompradora);
        this.idSucursal = new SucursalEmpresaDTO(idSucursal);
        this.idUsuario = new UsuarioDTO(idUsuario);
    }
}
