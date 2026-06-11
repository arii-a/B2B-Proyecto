package com.example.B2BProyect.config;

import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.LogService;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

@Slf4j
@Configuration
public class InjectConfiguration {

    @Value("${async.core-pool-size:5}")
    private int corePoolSize;
    @Value("${async.max-pool-size:10}")
    private int maxPoolSize;
    @Value("${async.queue-capacity:20}")
    private int queueCapacity;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    private LogService logService;

    @Bean
    public AuditorAware<String> auditorAware() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

            if (authentication == null || !authentication.isAuthenticated()) {
                return Optional.of("SYSTEM");
            }

            Object principal = authentication.getPrincipal();

            if (principal instanceof Usuario user) {
                return Optional.of(user.getUsername());
            }

            return Optional.of("SYSTEM");
        };
    }

    @Bean(name = "taskLog")
    public ThreadPoolTaskExecutor myTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(corePoolSize);
        executor.setMaxPoolSize(maxPoolSize);
        executor.setQueueCapacity(queueCapacity);

        executor.setThreadNamePrefix("Miguel-");
        executor.initialize();
        return executor;
    }


}