package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.UnidadMedida;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class UnidadMedidaDTO {
    private UUID id;
    private String nombre;
    private String abreviatura;
    private Boolean activo;

    public UnidadMedidaDTO(UnidadMedida u) {
        this.id = u.getId();
        this.nombre = u.getNombre();
        this.abreviatura = u.getAbreviatura();
        this.activo = u.getActivo();
    }

    public UnidadMedidaDTO(UUID id, String nombre, String abreviatura, Boolean activo) {
        this.id = id;
        this.nombre = nombre;
        this.abreviatura = abreviatura;
        this.activo = activo;
    }
}
