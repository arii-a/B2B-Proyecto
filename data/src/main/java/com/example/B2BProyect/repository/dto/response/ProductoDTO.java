package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Categoria;
import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.repository.entity.Proveedor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ProductoDTO {
    private UUID id;
    private String sku;
    private String nombre;
    private String descripcion;
    private String unidadMedida;
    private boolean activo;
    private String nombreCategoria;
    private String nombreProveedor;
    private CategoriaDTO idCategoria;
    private ProveedorDTO idProveedor;

    public ProductoDTO(Producto producto) {
        this.id = producto.getId();
        this.sku = producto.getSku();
        this.nombre = producto.getNombre();
        this.descripcion = producto.getDescripcion();
        this.unidadMedida = producto.getUnidadMedida();
        this.activo = producto.getActivo();
        if (producto.getIdCategoria() != null) {
            this.idCategoria = new CategoriaDTO(producto.getIdCategoria());
        }
        if (producto.getIdProveedor() != null) {
            this.idProveedor = new ProveedorDTO(producto.getIdProveedor());
        }
    }

    public ProductoDTO(UUID id, String sku, String nombre, String descripcion,
                       String unidadMedida, Boolean activo, String nombreCategoria, String nombreProveedor) {
        this.id = id;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.unidadMedida = unidadMedida;
        this.activo = activo;
        this.nombreCategoria = nombreCategoria;
        this.nombreProveedor = nombreProveedor;
    }

    public ProductoDTO(UUID id, String sku, String nombre, String descripcion,
                       String unidadMedida, Boolean activo, Categoria idCategoria, Proveedor idProveedor) {
        this.id = id;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.unidadMedida = unidadMedida;
        this.activo = activo;
        if (idCategoria != null) this.idCategoria = new CategoriaDTO(idCategoria);
        if (idProveedor != null) this.idProveedor = new ProveedorDTO(idProveedor);
    }
}
