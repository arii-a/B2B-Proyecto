package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.PrecioBase;
import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.repository.entity.Proveedor;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class PrecioBaseDTO {
    private UUID id;
    private BigDecimal precioBase;
    private Instant vigenteDesde;
    private Instant vigenteHasta;
    private String nombreProveedor;
    private String nombreProducto;
    private ProveedorDTO idProveedor;
    private ProductoDTO idProducto;

    public PrecioBaseDTO(PrecioBase precioBase) {
        this.id = precioBase.getId();
        this.precioBase = precioBase.getPrecioBase();
        this.vigenteDesde = precioBase.getVigenteDesde();
        this.vigenteHasta = precioBase.getVigenteHasta();
        this.idProveedor = new ProveedorDTO(precioBase.getIdProveedor());
        this.idProducto = new ProductoDTO(precioBase.getIdProducto());
    }

    public PrecioBaseDTO(UUID id, BigDecimal precioBase, Instant vigenteDesde, Instant vigenteHasta,
                         String nombreProveedor, String nombreProducto) {
        this.id = id;
        this.precioBase = precioBase;
        this.vigenteDesde = vigenteDesde;
        this.vigenteHasta = vigenteHasta;
        this.nombreProveedor = nombreProveedor;
        this.nombreProducto = nombreProducto;
    }

    public PrecioBaseDTO(UUID id, BigDecimal precioBase, Instant vigenteDesde, Instant vigenteHasta,
                         Proveedor idProveedor, Producto idProducto) {
        this.id = id;
        this.precioBase = precioBase;
        this.vigenteDesde = vigenteDesde;
        this.vigenteHasta = vigenteHasta;
        this.idProveedor = new ProveedorDTO(idProveedor);
        this.idProducto = new ProductoDTO(idProducto);
    }
}
