package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Categoria;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class CategoriaDTO {
    private UUID id;
    private String nombre;
    private String descripcion;

    public CategoriaDTO(Categoria categoria) {
        this.id = categoria.getId();
        this.nombre = categoria.getNombre();
        this.descripcion = categoria.getDescripcion();
    }

    public CategoriaDTO(UUID id, String nombre, String descripcion) {
        this.id = id;
        this.nombre = nombre;
        this.descripcion = descripcion;
    }

    public CategoriaDTO(UUID id, String nombre) {
        this.id = id;
        this.nombre = nombre;
    }

    public CategoriaDTO(UUID id) {
        this.id = id;
    }
}
