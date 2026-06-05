package com.example.B2BProyect.integracion;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class Transaction {
    private String country;

    private BigDecimal amount;

    @JsonProperty("amount_received")
    private BigDecimal amountReceived;

    @JsonProperty("status_description")
    private String statusDescription;

    private String currency;

    private String network;

    @JsonProperty("created_date")
    private Long createdDate;

    private String id;
    @JsonProperty("payment_date")
    private Long paymentDate;

    @JsonProperty("idempotency_key")
    private UUID idempotencyKey;

    private String status;
}
