package com.example.B2BProyect.repository.dto.request;

import com.example.B2BProyect.repository.entity.Materia;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class EstudianteRequest {
    private UUID id;
    private String nombre;
    private String apellido;
    private Materia idMateria;
    private Integer nota;

    @JsonProperty("nro_documento")
    private String nroDocumento;

    @JsonProperty("nro_telefono")
    private String nroTelefono;

}
