package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class TarifaReglaRequest {
    private String nombre;
    private String descripcion;
    private Boolean activo;
    private UUID idProveedor;
}
