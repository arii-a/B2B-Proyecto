package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.util.UUID;

@AllArgsConstructor
public class ContactosEmpresaDTO {
    private UUID id;
    private String nombres;
    private String apellidos;
    private UUID idCargoEmpresa;
    private UUID idEmpresa;
}
