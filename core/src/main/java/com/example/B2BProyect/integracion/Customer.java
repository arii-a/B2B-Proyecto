package com.example.B2BProyect.integracion;


import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@ToString
public class Customer {
    private String name;
    private String lastname;
    @JsonProperty("document_number")
    private String documentNumber;
}
