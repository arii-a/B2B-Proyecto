package com.example.B2BProyect.integracion.stereum;

import lombok.Data;

import java.util.UUID;

@Data
public class PaymentRequest {
    private UUID orderId;
}
