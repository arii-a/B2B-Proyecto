package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@AllArgsConstructor
public class ContratoEmpresaTarifasDTO {
    private UUID id;
    private UUID idEmpresa;
    private UUID idProveedor;
    private UUID idRegla;
    private LocalDate vigenteDesde;
    private LocalDate vigenteHasta;
    private boolean activo;
}
