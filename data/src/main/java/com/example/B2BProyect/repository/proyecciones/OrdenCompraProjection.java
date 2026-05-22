package com.example.B2BProyect.repository.proyecciones;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public interface OrdenCompraProjection {
    UUID getId();
    Instant getFecha();
    String getIdEstado();
    BigDecimal getTotal();
}
