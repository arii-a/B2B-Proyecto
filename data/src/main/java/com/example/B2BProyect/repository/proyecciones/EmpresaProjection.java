package com.example.B2BProyect.repository.proyecciones;

import org.springframework.beans.factory.annotation.Value;

import java.util.UUID;

public interface EmpresaProjection {
    UUID getId();
    String getNombre();
    String getNit();
    String getRazonSocial();
    Boolean getActivo();


    @Value("#{target.nombre + ' - ' + target.nit}")
    String getNombreConNit();
}
