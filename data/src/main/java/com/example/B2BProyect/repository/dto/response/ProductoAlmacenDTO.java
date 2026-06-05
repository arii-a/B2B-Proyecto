package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Almacen;
import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.repository.entity.ProductoAlmacen;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Getter
@Setter
public class ProductoAlmacenDTO {
    private UUID idAlmacen;
    private UUID idProducto;
    private int stock;
    private BigDecimal max;
    private BigDecimal min;
    private boolean activo;
    private String nombreAlmacen;
    private String nombreProducto;
    private AlmacenDTO almacen;
    private ProductoDTO producto;

    public ProductoAlmacenDTO(ProductoAlmacen productoAlmacen) {
        this.idAlmacen = productoAlmacen.getId().getIdAlmacen();
        this.idProducto = productoAlmacen.getId().getIdProducto();
        this.stock = productoAlmacen.getStock();
        this.max = productoAlmacen.getMax();
        this.min = productoAlmacen.getMin();
        this.activo = productoAlmacen.getActivo();
        this.almacen = new AlmacenDTO(productoAlmacen.getAlmacen());
        this.producto = new ProductoDTO(productoAlmacen.getProducto());
    }

    public ProductoAlmacenDTO(UUID idAlmacen, UUID idProducto, Integer stock, BigDecimal max, BigDecimal min,
                               Boolean activo, String nombreAlmacen, String nombreProducto) {
        this.idAlmacen = idAlmacen;
        this.idProducto = idProducto;
        this.stock = stock;
        this.max = max;
        this.min = min;
        this.activo = activo;
        this.nombreAlmacen = nombreAlmacen;
        this.nombreProducto = nombreProducto;
    }

    public ProductoAlmacenDTO(UUID idAlmacen, UUID idProducto, Integer stock, BigDecimal max, BigDecimal min,
                               Boolean activo, Almacen almacen, Producto producto) {
        this.idAlmacen = idAlmacen;
        this.idProducto = idProducto;
        this.stock = stock;
        this.max = max;
        this.min = min;
        this.activo = activo;
        this.almacen = new AlmacenDTO(almacen);
        this.producto = new ProductoDTO(producto);
    }
}
