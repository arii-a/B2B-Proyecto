package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.SucursalEmpresa;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class SucursalEmpresaDTO {
    private UUID id;
    private String nombre;
    private String direccion;
    private String coordenadas;
    private boolean activo;
    private String nombreEmpresa;
    private EmpresaDTO idEmpresa;

    public SucursalEmpresaDTO(SucursalEmpresa sucursal) {
        this.id = sucursal.getId();
        this.nombre = sucursal.getNombre();
        this.direccion = sucursal.getDireccion();
        this.coordenadas = sucursal.getCoordenadas();
        this.activo = sucursal.getActivo();
        this.idEmpresa = new EmpresaDTO(sucursal.getIdEmpresa());
    }

    public SucursalEmpresaDTO(UUID id, String nombre, String direccion, String coordenadas,
                               Boolean activo, String nombreEmpresa) {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.coordenadas = coordenadas;
        this.activo = activo;
        this.nombreEmpresa = nombreEmpresa;
    }

    public SucursalEmpresaDTO(UUID id, String nombre, String direccion, String coordenadas,
                               Boolean activo, Empresa idEmpresa) {
        this.id = id;
        this.nombre = nombre;
        this.direccion = direccion;
        this.coordenadas = coordenadas;
        this.activo = activo;
        this.idEmpresa = new EmpresaDTO(idEmpresa);
    }
}
