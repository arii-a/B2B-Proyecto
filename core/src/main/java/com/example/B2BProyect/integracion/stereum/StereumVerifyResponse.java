package com.example.B2BProyect.integracion.stereum;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
@JsonIgnoreProperties(ignoreUnknown = true)
public class StereumVerifyResponse {
    private String status;
    @JsonProperty("idempotency_key")
    private UUID idempotencyKey;
    private String id;
}
