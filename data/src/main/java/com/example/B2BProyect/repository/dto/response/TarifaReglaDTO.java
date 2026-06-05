package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Proveedor;
import com.example.B2BProyect.repository.entity.TarifaRegla;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class TarifaReglaDTO {
    private UUID id;
    private String nombre;
    private String descripcion;
    private boolean activo;
    private String nombreProveedor;
    private ProveedorDTO idProveedor;

    public TarifaReglaDTO(TarifaRegla tarifaRegla) {
        this.id = tarifaRegla.getId();
        this.nombre = tarifaRegla.getNombre();
        this.descripcion = tarifaRegla.getDescripcion();
        this.activo = tarifaRegla.getActivo();
        this.idProveedor = new ProveedorDTO(tarifaRegla.getIdProveedor());
    }

    public TarifaReglaDTO(UUID id, String nombre, String descripcion, Boolean activo, String nombreProveedor) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.activo = activo;
        this.nombreProveedor = nombreProveedor;
    }

    public TarifaReglaDTO(UUID id, String nombre, String descripcion, Boolean activo, Proveedor idProveedor) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.activo = activo;
        this.idProveedor = new ProveedorDTO(idProveedor);
    }
}
