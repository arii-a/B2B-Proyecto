package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.RolUsuario;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class RolUsuarioDTO {
    private UUID id;
    private String nombre;
    private String descripcion;

    public RolUsuarioDTO(RolUsuario r) {
        this.id = r.getId();
        this.nombre = r.getNombre();
        this.descripcion = r.getDescripcion();
    }
}
