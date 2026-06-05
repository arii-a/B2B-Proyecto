package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.ContratoEmpresaTarifa;
import com.example.B2BProyect.repository.entity.Empresa;
import com.example.B2BProyect.repository.entity.Proveedor;
import com.example.B2BProyect.repository.entity.TarifaRegla;
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
    private String nombreEmpresa;
    private String nombreProveedor;
    private String nombreRegla;
    private EmpresaDTO idEmpresa;
    private ProveedorDTO idProveedor;
    private TarifaReglaDTO idRegla;

    public ContratoEmpresaTarifasDTO(ContratoEmpresaTarifa contrato) {
        this.id = contrato.getId();
        this.vigenteDesde = contrato.getVigenteDesde();
        this.vigenteHasta = contrato.getVigenteHasta();
        this.activo = contrato.getActivo();
        this.idEmpresa = new EmpresaDTO(contrato.getIdEmpresa());
        this.idProveedor = new ProveedorDTO(contrato.getIdProveedor());
        this.idRegla = new TarifaReglaDTO(contrato.getIdRegla());
    }

    public ContratoEmpresaTarifasDTO(UUID id, Instant vigenteDesde, Instant vigenteHasta, Boolean activo,
                                      String nombreEmpresa, String nombreProveedor, String nombreRegla) {
        this.id = id;
        this.vigenteDesde = vigenteDesde;
        this.vigenteHasta = vigenteHasta;
        this.activo = activo;
        this.nombreEmpresa = nombreEmpresa;
        this.nombreProveedor = nombreProveedor;
        this.nombreRegla = nombreRegla;
    }

    public ContratoEmpresaTarifasDTO(UUID id, Instant vigenteDesde, Instant vigenteHasta, Boolean activo,
                                      Empresa idEmpresa, Proveedor idProveedor, TarifaRegla idRegla) {
        this.id = id;
        this.vigenteDesde = vigenteDesde;
        this.vigenteHasta = vigenteHasta;
        this.activo = activo;
        this.idEmpresa = new EmpresaDTO(idEmpresa);
        this.idProveedor = new ProveedorDTO(idProveedor);
        this.idRegla = new TarifaReglaDTO(idRegla);
    }
}
