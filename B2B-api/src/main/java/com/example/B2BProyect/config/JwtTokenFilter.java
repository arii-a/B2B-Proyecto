package com.example.B2BProyect.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.Serializable;
import java.util.Optional;

@Slf4j
@Component
@AllArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter implements Serializable {
    private final JwtTokenProvider jwtTokenProvider;


    @Override
    protected void doFilterInternal(HttpServletRequest servletRequest, HttpServletResponse servletResponse, FilterChain filterChain) throws ServletException, IOException {
        try {

            String token = jwtTokenProvider.resolveToken(servletRequest.getHeader("Authorization"));
            if (token == null) {
                filterChain.doFilter(servletRequest, servletResponse);
                return;
            }

            try {
                Optional<Authentication> optionalAuthentication = jwtTokenProvider.validateToken(token);
                if (optionalAuthentication.isPresent()) {
                    SecurityContextHolder.getContext().setAuthentication(optionalAuthentication.get());
                    filterChain.doFilter(servletRequest, servletResponse);
                    return;
                }
                log.error("No se logro validar el JWT, por lo que se devuelve codigo 403. FORBIDDEN");
                servletResponse.setContentType(MediaType.APPLICATION_JSON.getType());
                servletResponse.getWriter().write(new ObjectMapper().writeValueAsString(HttpStatus.UNAUTHORIZED));
                servletResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
            } catch (UsernameNotFoundException e) {
                log.error("Usuario no encontrado al usuario o contrasenia; por lo que se devuelve codigo 403. FORBIDDEN ");
                servletResponse.setContentType(MediaType.APPLICATION_JSON.getType());
                servletResponse.getWriter().write(new ObjectMapper().writeValueAsString(HttpStatus.UNAUTHORIZED));
                servletResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
            } catch (ExpiredJwtException e) {
                log.error("No se logro validar el JWT, por lo que se devuelve codigo 403. FORBIDDEN");
                servletResponse.setContentType(MediaType.APPLICATION_JSON.getType());
                servletResponse.getWriter().write(new ObjectMapper().writeValueAsString(HttpStatus.UNAUTHORIZED));
                servletResponse.setStatus(HttpStatus.UNAUTHORIZED.value());
            }

        } catch (Exception e) {
            log.error("Se genero una exepción generica al validar el JWT", e);
            servletResponse.setContentType(MediaType.APPLICATION_JSON.getType());
            servletResponse.getWriter().write(new ObjectMapper().writeValueAsString(HttpStatus.INTERNAL_SERVER_ERROR));
            servletResponse.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
        }
    }


}