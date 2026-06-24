package com.example.B2BProyect.config;

import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.ApiKeyService;
import com.example.B2BProyect.service.exception.NotDataFoundException;
import com.example.B2BProyect.service.exception.OperationException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.io.Serializable;

@Slf4j
@Component
@AllArgsConstructor
public class ApiKeyFilter extends OncePerRequestFilter implements Serializable {

    private static final String API_KEY_HEADER = "X-API-Key";

    private final ApiKeyService apiKeyService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String rawKey = request.getHeader(API_KEY_HEADER);
        if (rawKey == null || rawKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        // If JWT filter already authenticated the request, skip
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            Usuario usuario = apiKeyService.validateKey(rawKey);
            var auth = new UsernamePasswordAuthenticationToken(usuario, "", usuario.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);
        } catch (NotDataFoundException | OperationException e) {
            log.warn("API Key inválida o expirada: {}", e.getMessage());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(HttpStatus.UNAUTHORIZED.value());
            response.getWriter().write(new ObjectMapper().writeValueAsString(HttpStatus.UNAUTHORIZED));
        } catch (Exception e) {
            log.error("Error al validar API Key", e);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.value());
            response.getWriter().write(new ObjectMapper().writeValueAsString(HttpStatus.INTERNAL_SERVER_ERROR));
        }
    }
}
