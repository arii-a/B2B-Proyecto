package com.example.B2BProyect.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.context.annotation.Profile;

@OpenAPIDefinition(
        info = @Info(
                title = "APIs de ejemplo",
                version = "v1",
                description = "Esta aplicación provee APIs REST de pruebas",
                contact = @Contact(
                        name = "Ariana Mendivil",
                        email = "amendivil@gmail.com"
                )
        ),
        servers = {
                @Server(
                        url = "http://localhost:8080",
                        description = " Servidor de desarrollo"
                ), @Server(
                url = "http://localhost:8080",
                description = " Servidor de desarrollo"
        ), @Server(
                url = "https://api.ejemplo.net",
                description = "Servidor de producción"
        )
        }
)
@SecurityScheme(
        name = "bearerToken",
        type = SecuritySchemeType.HTTP,
        in = SecuritySchemeIn.HEADER,
        scheme = "bearer",
        bearerFormat = "jwt"
)
@Profile({"dev", "local", "swagger"})
public class OpenApiConfig {
}