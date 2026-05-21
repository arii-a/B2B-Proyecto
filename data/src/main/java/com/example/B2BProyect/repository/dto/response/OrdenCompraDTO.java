package com.example.B2BProyect.repository.dto.response;

import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@AllArgsConstructor
public class OrdenCompraDTO {
    private UUID id;
    private BigDecimal total;
    private LocalDate fecha;
    private LocalDate fechaOrden;
    private UUID idProveedor;
    private UUID idEmpresaCompradora;
    private UUID idSucursal;
    private UUID idUsuario;
    private UUID idEstado;
}
