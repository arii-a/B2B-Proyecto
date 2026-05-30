package com.example.B2BProyect.integracion;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class B2BAuthRequest {
//    B2B
//    private String email;
//    private String passwordHash;
//    MATIAS
    private String username;
    private String password;


}
