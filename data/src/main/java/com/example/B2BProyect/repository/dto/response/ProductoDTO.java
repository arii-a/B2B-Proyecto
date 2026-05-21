package com.example.B2BProyect.repository.dto.response;

import java.util.UUID;

public class ProductoDTO {
    private UUID id;
    private String sku;
    private String nombre;
    private String descripcion;
    private String unidadMedida;
    private boolean activo;
    private UUID idCategoria;
    private UUID idProveedor;
}
