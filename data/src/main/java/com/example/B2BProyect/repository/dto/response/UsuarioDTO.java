package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class UsuarioDTO {
    private UUID id;
    private String nombre;
    private String email;
    private boolean activo;
    private String nombreEmpresa;
    private String nombreSucursal;
    private String nombreRol;

    private EmpresaDTO idEmpresa;
    private SucursalEmpresaDTO idSucursal;
    private RolUsuario idRol;

    public UsuarioDTO(Usuario usuario) {
        this.id = usuario.getId();
        this.nombre = usuario.getNombre();
        this.email = usuario.getEmail();
        this.activo = usuario.getActivo();
    }

    public UsuarioDTO(UUID id, String nombre, String email, Boolean activo,
                      String nombreEmpresa, String nombreSucursal, String nombreRol) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.activo = activo;
        this.nombreEmpresa = nombreEmpresa;
        this.nombreSucursal = nombreSucursal;
        this.nombreRol = nombreRol;
    }

    public UsuarioDTO(UUID id, String nombre, String email, Boolean activo,
                      Empresa idEmpresa, SucursalEmpresa idSucursal) {
        this.id = id;
        this.nombre = nombre;
        this.email = email;
        this.activo = activo;
        this.idEmpresa = new EmpresaDTO(idEmpresa);
    }
}
