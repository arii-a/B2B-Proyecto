package com.example.B2BProyect.repository.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class OrdenCompraRequest {
    private BigDecimal total;
    private Instant fecha;
    private LocalDate fechaOrden;
    private String idEstado;
    private UUID idProveedor;
    private UUID idEmpresaCompradora;
    private UUID idSucursal;
    private UUID idUsuario;
}
