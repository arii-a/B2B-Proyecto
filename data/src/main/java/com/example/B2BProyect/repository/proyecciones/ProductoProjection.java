package com.example.B2BProyect.repository.proyecciones;

import org.springframework.beans.factory.annotation.Value;

import java.util.UUID;

public interface ProductoProjection {
    UUID getId();
    String getSku();
    String getNombre();
    Boolean getActivo();

    @Value("#{target.sku + ' - ' + target.nombre}")
    String getSkuConNombre();
}
