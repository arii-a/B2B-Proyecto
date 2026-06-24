package com.example.B2BProyect.repository.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RegisterRequest {

    private EmpresaData empresa;
    private ContactoData contacto;
    private SucursalData sucursal;
    private UsuarioData usuario;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class EmpresaData {
        private String nombre;
        @JsonProperty("razon_social")
        private String razonSocial;
        private String nit;
        private String dominio;
        @JsonProperty("logo_url")
        private String logoUrl;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class ContactoData {
        private String nombres;
        private String apellidos;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class SucursalData {
        private String nombre;
        private String direccion;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    public static class UsuarioData {
        private String nombre;
        private String email;
        private String password;
    }
}
