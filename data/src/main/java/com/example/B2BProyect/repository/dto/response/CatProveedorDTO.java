package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.CatProveedor;
import com.example.B2BProyect.repository.entity.Categoria;
import com.example.B2BProyect.repository.entity.Proveedor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CatProveedorDTO {
    private UUID idCategoria;
    private UUID idProveedor;
    private String nombreCategoria;
    private String nombreProveedor;
    private CategoriaDTO categoria;
    private ProveedorDTO proveedor;

    public CatProveedorDTO(CatProveedor catProveedor) {
        this.idCategoria = catProveedor.getId().getIdCategoria();
        this.idProveedor = catProveedor.getId().getIdProveedor();
        this.categoria = new CategoriaDTO(catProveedor.getIdCategoria());
        this.proveedor = new ProveedorDTO(catProveedor.getIdProveedor());
    }

    public CatProveedorDTO(UUID idCategoria, UUID idProveedor, String nombreCategoria, String nombreProveedor) {
        this.idCategoria = idCategoria;
        this.idProveedor = idProveedor;
        this.nombreCategoria = nombreCategoria;
        this.nombreProveedor = nombreProveedor;
    }

    public CatProveedorDTO(UUID idCategoria, UUID idProveedor, Categoria categoria, Proveedor proveedor) {
        this.idCategoria = idCategoria;
        this.idProveedor = idProveedor;
        this.categoria = new CategoriaDTO(categoria);
        this.proveedor = new ProveedorDTO(proveedor);
    }
}
