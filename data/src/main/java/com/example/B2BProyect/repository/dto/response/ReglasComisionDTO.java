package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Proveedor;
import com.example.B2BProyect.repository.entity.ReglasComision;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ReglasComisionDTO {
    private UUID id;
    private String nombre;
    private String idTipo;
    private BigDecimal valor;
    private boolean activa;
    private Instant fechaInicio;
    private Instant fechaFinal;
    private String nombreProveedor;
    private ProveedorDTO idProveedor;

    public ReglasComisionDTO(ReglasComision regla) {
        this.id = regla.getId();
        this.nombre = regla.getNombre();
        this.idTipo = regla.getIdTipo();
        this.valor = regla.getValor();
        this.activa = regla.getActiva();
        this.fechaInicio = regla.getFechaInicio();
        this.fechaFinal = regla.getFechaFinal();
        this.idProveedor = new ProveedorDTO(regla.getIdProveedor());
    }

    public ReglasComisionDTO(UUID id, String nombre, String idTipo, BigDecimal valor, Boolean activa,
                              Instant fechaInicio, Instant fechaFinal, String nombreProveedor) {
        this.id = id;
        this.nombre = nombre;
        this.idTipo = idTipo;
        this.valor = valor;
        this.activa = activa;
        this.fechaInicio = fechaInicio;
        this.fechaFinal = fechaFinal;
        this.nombreProveedor = nombreProveedor;
    }

    public ReglasComisionDTO(UUID id, String nombre, String idTipo, BigDecimal valor, Boolean activa,
                              Instant fechaInicio, Instant fechaFinal, Proveedor idProveedor) {
        this.id = id;
        this.nombre = nombre;
        this.idTipo = idTipo;
        this.valor = valor;
        this.activa = activa;
        this.fechaInicio = fechaInicio;
        this.fechaFinal = fechaFinal;
        this.idProveedor = new ProveedorDTO(idProveedor);
    }
}
