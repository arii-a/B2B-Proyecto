package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ContactosEmpresaRequest {
    private String nombres;
    private String apellidos;
    private UUID idCargoEmpresa;
    private UUID idEmpresa;
}
