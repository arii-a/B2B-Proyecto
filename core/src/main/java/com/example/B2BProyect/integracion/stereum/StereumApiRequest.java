package com.example.B2BProyect.integracion.stereum;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class StereumApiRequest {
    private String country;
    private String amount;
    private String currency;
    private String network;
    @JsonProperty("charge_reason")
    private String chargeReason;
    @JsonProperty("idempotency_key")
    private String idempotencyKey;
    @JsonProperty("reservation_validity_time")
    private String reservationValidityTime;
    private Customer customer;
}
