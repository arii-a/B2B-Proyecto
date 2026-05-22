package com.example.B2BProyect.repository.dto.response;

import com.example.B2BProyect.repository.entity.Comision;
import com.example.B2BProyect.repository.entity.Proveedor;
import com.example.B2BProyect.repository.entity.ReglasComision;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
public class ComisionDTO {
    private UUID id;
    private BigDecimal montoComision;
    private BigDecimal montoProveedor;
    private Instant fecha;
    private UUID idDetalleOrden;
    private String nombreProveedor;
    private String nombreReglaComision;
    private ProveedorDTO idProveedor;
    private ReglasComisionDTO idReglaComision;

    public ComisionDTO(Comision comision) {
        this.id = comision.getId();
        this.montoComision = comision.getMontoComision();
        this.montoProveedor = comision.getMontoProveedor();
        this.fecha = comision.getFecha();
        this.idDetalleOrden = comision.getIdDetalleOrden().getId();
        this.idProveedor = new ProveedorDTO(comision.getIdProveedor());
        this.idReglaComision = new ReglasComisionDTO(comision.getIdReglaComision());
    }

    public ComisionDTO(UUID id, BigDecimal montoComision, BigDecimal montoProveedor, Instant fecha,
                       UUID idDetalleOrden, String nombreProveedor, String nombreReglaComision) {
        this.id = id;
        this.montoComision = montoComision;
        this.montoProveedor = montoProveedor;
        this.fecha = fecha;
        this.idDetalleOrden = idDetalleOrden;
        this.nombreProveedor = nombreProveedor;
        this.nombreReglaComision = nombreReglaComision;
    }

    public ComisionDTO(UUID id, BigDecimal montoComision, BigDecimal montoProveedor, Instant fecha,
                       UUID idDetalleOrden, Proveedor idProveedor, ReglasComision idReglaComision) {
        this.id = id;
        this.montoComision = montoComision;
        this.montoProveedor = montoProveedor;
        this.fecha = fecha;
        this.idDetalleOrden = idDetalleOrden;
        this.idProveedor = new ProveedorDTO(idProveedor);
        this.idReglaComision = new ReglasComisionDTO(idReglaComision);
    }
}
