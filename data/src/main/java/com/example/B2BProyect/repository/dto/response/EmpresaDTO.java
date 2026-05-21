package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class EmpresaDTO {
    private UUID id;
    private String nombre;
    private String dominio;
    private Boolean activo = true;
    private String nit;
    private String razonSocial;

    public EmpresaDTO(Empresa empresa) {
        this.id = empresa.getId();
        this.nombre = empresa.getNombre();
        this.dominio = empresa.getDominio();
        this.activo = empresa.getActivo();
        this.nit = empresa.getNit();
        this.razonSocial = empresa.getRazonSocial();
    }

    public EmpresaDTO(UUID id, String nombre, String dominio, String nit, String razonSocial) {
        this.id = id;
        this.nombre = nombre;
        this.dominio = dominio;
        this.nit = nit;
        this.razonSocial = razonSocial;
    }

    public EmpresaDTO(UUID id) {
        this.id = id;
    }
}