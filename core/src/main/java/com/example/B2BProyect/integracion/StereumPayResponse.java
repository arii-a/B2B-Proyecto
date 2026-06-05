package com.example.B2BProyect.integracion;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class StereumPayResponse{
    @JsonProperty("notification_type")
    private String notificationType;
    private String id;
    private Transaction transaction;
    private Long timestamp;
}