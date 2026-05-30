package com.example.B2BProyect.service.integration;


import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Sistema1AuthRequest {
    private String email;
    private String passwordHash;
}
