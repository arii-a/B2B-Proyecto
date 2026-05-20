package com.example.B2BProyect.repository.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import org.antlr.v4.runtime.misc.NotNull;

@Builder
@Getter
@AllArgsConstructor
@NoArgsConstructor
public class EmpresaRequest {

    private String nombre;
    private String dominio;

    @NotNull
    private Boolean activo;
    private String nit;

    @JsonProperty("razon_social")
    private String razonSocial;
}
