package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class ContratoEmpresaTarifaRequest {
    private Instant vigenteDesde;
    private Instant vigenteHasta;
    private Boolean activo;
    private UUID idEmpresa;
    private UUID idProveedor;
    private UUID idRegla;
}
