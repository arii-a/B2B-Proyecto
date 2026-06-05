package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ProductoRequest {
    private String sku;
    private String nombre;
    private String descripcion;
    private String unidadMedida;
    private Boolean activo;
    private UUID idCategoria;
    private UUID idProveedor;
}
