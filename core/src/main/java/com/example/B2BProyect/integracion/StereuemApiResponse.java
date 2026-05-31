package com.example.B2BProyect.integracion;

import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class StereuemApiResponse {
    private int amount;
    private String currency;
    private String network;
    private String id;
    private String payment_link;
    private String on_main_net;
    private String collecting_account;
    private long expiration_time;
}
