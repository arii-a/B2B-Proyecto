package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Almacen;
import com.example.B2BProyect.repository.entity.Proveedor;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.geo.Point;

import java.awt.*;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class AlmacenDTO {
    private UUID id;
    private String nombre;
    private String direccion;
    private Point coordenadas;
    private boolean activo;
    private String nombreProveedor;

    private ProveedorDTO idProveedor;

    public AlmacenDTO(Almacen almacen) {
        this.id = almacen.getId();
        this.nombre = almacen.getNombre();
        this.direccion = almacen.getDireccion();
        this.coordenadas = almacen.getCoordenadas();
        this.activo = almacen.getActivo();
        this.idProveedor = new ProveedorDTO(almacen.getIdProveedor());
    }

    public AlmacenDTO(UUID id, String nombre, String direccion, Point coordenadas,
                      Boolean activo, String nombreProveedor) {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.activo = activo;
        this.coordenadas = coordenadas;
        this.nombreProveedor = nombreProveedor;
    }

    public AlmacenDTO(UUID id, String nombre, String direccion, Point coordenadas,
                      Boolean activo, Proveedor idProveedor) {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.activo = activo;
        this.coordenadas = coordenadas;
        this.idProveedor = new ProveedorDTO(idProveedor);
    }
}
