package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.ContratoEmpresaTarifa;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ContratoEmpresaTarifasDTO {
    private UUID id;
    private Instant vigenteDesde;
    private Instant vigenteHasta;
    private boolean activo;
    private EmpresaDTO idEmpresa;
    private ProveedorDTO idProveedor;

    public ContratoEmpresaTarifasDTO(ContratoEmpresaTarifa contrato) {
        this.id = contrato.getId();
        this.vigenteDesde = contrato.getVigenteDesde();
        this.vigenteHasta = contrato.getVigenteHasta();
        this.activo = contrato.getActivo();
        this.idEmpresa = new EmpresaDTO(contrato.getIdEmpresa());
        this.idProveedor = new ProveedorDTO(contrato.getIdProveedor());
    }
}
