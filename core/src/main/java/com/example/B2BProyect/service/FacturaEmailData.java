package com.example.B2BProyect.service;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Getter
@AllArgsConstructor
public class FacturaEmailData {
    private final UUID facturaId;
    private final UUID ordenId;
    private final String fecha;
    private final String estado;
    private final String compradoraNombre;
    private final String compradoraNit;
    private final String proveedorNombre;
    private final String proveedorNit;
    private final BigDecimal total;
    private final List<Item> items;

    @Getter
    @AllArgsConstructor
    public static class Item {
        private final String producto;
        private final Integer cantidad;
        private final BigDecimal precioUnitario;
        private final BigDecimal subtotal;
    }
}
