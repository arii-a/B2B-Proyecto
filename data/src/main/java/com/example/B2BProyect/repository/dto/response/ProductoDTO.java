package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Categoria;
import com.example.B2BProyect.repository.entity.Producto;
import com.example.B2BProyect.repository.entity.Proveedor;
import com.example.B2BProyect.repository.entity.UnidadMedida;
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
    private UnidadMedidaDTO idUnidadMedida;
    private boolean activo;
    private String nombreCategoria;
    private String nombreProveedor;
    private String nombreUnidadMedida;
    private CategoriaDTO idCategoria;
    private ProveedorDTO idProveedor;

    public ProductoDTO(Producto producto) {
        this.id = producto.getId();
        this.sku = producto.getSku();
        this.nombre = producto.getNombre();
        this.descripcion = producto.getDescripcion();
        this.activo = producto.getActivo();
        if (producto.getIdUnidadMedida() != null) {
            this.idUnidadMedida = new UnidadMedidaDTO(producto.getIdUnidadMedida());
        }
        if (producto.getIdCategoria() != null) {
            this.idCategoria = new CategoriaDTO(producto.getIdCategoria());
        }
        if (producto.getIdProveedor() != null) {
            this.idProveedor = new ProveedorDTO(producto.getIdProveedor());
        }
    }

    public ProductoDTO(UUID id, String sku, String nombre, String descripcion,
                       Boolean activo, String nombreCategoria, String nombreProveedor, String nombreUnidadMedida) {
        this.id = id;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.activo = activo;
        this.nombreCategoria = nombreCategoria;
        this.nombreProveedor = nombreProveedor;
        this.nombreUnidadMedida = nombreUnidadMedida;
    }

    public ProductoDTO(UUID id, String sku, String nombre, String descripcion,
                       Boolean activo, Categoria idCategoria, Proveedor idProveedor, UnidadMedida idUnidadMedida) {
        this.id = id;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.activo = activo;
        if (idCategoria != null)    this.idCategoria    = new CategoriaDTO(idCategoria);
        if (idProveedor != null)    this.idProveedor    = new ProveedorDTO(idProveedor);
        if (idUnidadMedida != null) this.idUnidadMedida = new UnidadMedidaDTO(idUnidadMedida);
    }
}
