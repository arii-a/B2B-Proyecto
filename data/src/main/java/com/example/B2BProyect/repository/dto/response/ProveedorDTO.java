package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ProveedorDTO {
    private UUID id;
    private Boolean activo = false;
    private EmpresaDTO idEmpresa;

    public ProveedorDTO(Proveedor proveedor) {
        this.id = proveedor.getId();
        this.activo = proveedor.getActivo();
        this.idEmpresa = new EmpresaDTO(proveedor.getIdEmpresa());
    }

    public ProveedorDTO(UUID id, Boolean activo, EmpresaDTO idEmpresa) {
        this.id = id;
        this.activo = activo;
        this.idEmpresa = idEmpresa;
    }

    public ProveedorDTO(UUID id, Boolean activo, Empresa idEmpresa) {
        this.id = id;
        this.activo = activo;
        this.idEmpresa = new EmpresaDTO(idEmpresa);
    }

}