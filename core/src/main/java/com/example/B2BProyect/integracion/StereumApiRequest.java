package com.example.B2BProyect.integracion;

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
    @JsonProperty("reservation_validity_time")
    private String reservationValidityTime;
    private Customer costumer;
}
