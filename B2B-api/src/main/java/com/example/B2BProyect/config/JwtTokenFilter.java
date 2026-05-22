package com.example.B2BProyect.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.Serializable;

@Slf4j
@Component
@AllArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter implements Serializable {
    //private  final JwtTokenProvider jwtTokenProvider;


    @Override
    protected void doFilterInternal(HttpServletRequest servletRequest, HttpServletResponse servletResponse, FilterChain filterChain) throws ServletException, IOException {
        try {

            filterChain.doFilter(servletRequest, servletResponse);

        }catch (Exception e) {
            log.error("Se genero una exepción generica al validar el JWT", e);
            servletResponse.setContentType(MediaType.APPLICATION_JSON.getType());
            servletResponse.getWriter().write(new tools.jackson.databind.ObjectMapper().writeValueAsString(HttpStatus.INTERNAL_SERVER_ERROR));
            servletResponse.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        }
    }


}