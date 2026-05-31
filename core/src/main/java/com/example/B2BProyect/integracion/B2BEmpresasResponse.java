package com.example.B2BProyect.integracion;

import com.example.B2BProyect.repository.entity.Producto;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.OneToMany;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
@ToString
public class B2BEmpresasResponse {
    private String id;
    @JsonProperty("nombre_empresa")
    private String nombre;
    private String tipo;
}
