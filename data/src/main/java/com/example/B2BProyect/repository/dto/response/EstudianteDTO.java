package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EstudianteDTO {
    private UUID id;
    private String nombre;
    private String apellido;
    private String nombreMateria;
    private Integer nota;

    @JsonProperty("nro_telefono")
    private String nroTelefono;

    @JsonProperty("nro_documento")
    private String nroDocumento;

    private UUID idMateria;

    public EstudianteDTO(Estudiante estudiante) {
        this.id = estudiante.getId();
        this.nombre = estudiante.getNombre();
        this.apellido = estudiante.getApellido();
        this.idMateria = estudiante.getIdMateria().getId();
        this.nota = estudiante.getNota();
        this.nroTelefono = estudiante.getNroTelefono();
        this.nroDocumento = estudiante.getNroDocumento();
    }

    public EstudianteDTO(UUID id, String nombre, String apellido, Integer nota,
                      String nroTelefono, String nroDocumento, String nombreMateria) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.nota = nota;
        this.nroDocumento = nroDocumento;
        this.nroTelefono = nroTelefono;
        this.nombreMateria = nombreMateria;
    }

    public EstudianteDTO(UUID id, String nombre, String apellido, Integer nota,
                         String nroTelefono, String nroDocumento, Materia idMateria) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.nota = nota;
        this.nroDocumento = nroDocumento;
        this.nroTelefono = nroTelefono;
        this.idMateria = new Materia(idMateria).getId();
    }

}
