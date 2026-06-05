package com.example.B2BProyect.config;

import com.example.B2BProyect.repository.entity.Usuario;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Slf4j
@Configuration
public class InjectConfiguration {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                Usuario user = (Usuario) authentication.getPrincipal();
                return Optional.of(user.getUsername());
            }
            if(authentication.getPrincipal()==null || authentication.getPrincipal() instanceof String) {
                Usuario user = (Usuario) authentication.getPrincipal();
                return Optional.of(user.getUsername());
            }

            //User user = (User) authentication.getPrincipal();
            //try {
            //   return Optional.ofNullable(user.getId());
            //} catch (Exception e) {
            //   return Optional.of("ADMIN");
            //}
            return Optional.of("ADMIN");
        };
    }

}