package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class UnidadMedidaRequest {
    private String nombre;
    private String abreviatura;
    private Boolean activo;
}
