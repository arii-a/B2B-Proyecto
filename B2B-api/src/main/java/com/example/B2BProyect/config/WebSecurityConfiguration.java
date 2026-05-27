package com.example.B2BProyect.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.session.SessionManagementFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.io.Serializable;
import java.util.Locale;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class WebSecurityConfiguration implements WebMvcConfigurer, Serializable {


    @Bean
    @Order(1)
    public SecurityFilterChain filterChain(HttpSecurity http, CorsFilter corsFilter, JwtTokenFilter jwtTokenFilter) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .addFilterBefore(corsFilter, SessionManagementFilter.class)
                .authorizeHttpRequests(
                        authorizationManagerRequestMatcherRegistry ->
                                authorizationManagerRequestMatcherRegistry
                                        .requestMatchers("/swagger-ui/**",
                                                "/v3/api-docs/**",
                                                "/v3/api-docs",
                                                "/api-docs/**",
                                                "/swagger-ui.html").permitAll()

//                                        .requestMatchers(HttpMethod.GET, "api/v1/empresas")
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/empresas").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/proveedores").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/proveedores/**").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/almacenes").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/almacenes").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/products").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/products/**").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/categorias").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/categorias").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/categorias-proveedor").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/categorias-proveedor").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/cargos-empresa").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/cargos-empresa").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/comisiones").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/comisiones").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/contactos-empresa").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/contactos-empresa").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/contratos-empresa-detalle").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/contratos-empresa-detalle").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/contratos-empresa-tarifa").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/contratos-empresa-tarifa").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/detalles-factura").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/detalles-factura").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/detalles-orden").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/detalles-orden").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/facturas").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/facturas").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/ordenes-compra").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/ordenes-compra").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/precios-base").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/precios-base").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/productos-almacen").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/productos-almacen").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/reglas-comision").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/reglas-comision").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/roles-usuario").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/roles-usuario").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/sucursales-empresa").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/sucursales-empresa").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/tarifas-regla").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/tarifas-regla").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/tramos-tarifa").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/tramos-tarifa").permitAll()
//
//                                        .requestMatchers(HttpMethod.GET, "/api/v1/usuarios").permitAll()
//                                        .requestMatchers(HttpMethod.POST, "/api/v1/usuarios").permitAll()
//                                        .requestMatchers(HttpMethod.PUT, "/api/v1/usuarios/**").permitAll()

                                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()

                                        .requestMatchers("/error").anonymous() // <----- Fix
                                        .anyRequest().authenticated()

                )
                .sessionManagement(httpSecuritySessionManagementConfigurer -> httpSecuritySessionManagementConfigurer.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class)
                //.addFilterAfter(maintenanceModeFilter, UsernamePasswordAuthenticationFilter.class)
                .cors((cors) -> cors.configurationSource(apiConfigurationSource()));
        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    private CorsConfigurationSource apiConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

}