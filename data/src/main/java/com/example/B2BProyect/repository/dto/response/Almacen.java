package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.awt.*;
import java.util.UUID;

@AllArgsConstructor
public class Almacen {
    private UUID id;
    private String nombre;
    private String direccion;
    private Point coordenadas;
    private boolean activo;
    private UUID idProveedor;
}
