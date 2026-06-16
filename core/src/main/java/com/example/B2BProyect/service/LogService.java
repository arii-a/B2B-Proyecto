package com.example.B2BProyect.service;

import com.example.B2BProyect.repository.EmpresaRepository;
import com.example.B2BProyect.repository.LogRepository;
import com.example.B2BProyect.repository.entity.Log;
import com.example.B2BProyect.repository.enums.LogLevel;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@AllArgsConstructor
@Service
@Slf4j
public class LogService {
    private final LogRepository logRepository;
    private final EmpresaRepository empresaRepository;

    @Async("taskLog")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void info(String message) {
        log.info("{}", message);
        logRepository.save(Log.builder()
                .level(LogLevel.INFO)
                .descripcion(message)
                .build());
    }

    @Async("taskLog")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void error(String message) {
        logRepository.save(Log.builder()
                .level(LogLevel.ERROR)
                .descripcion(message)
                .build());
    }

    @Async("taskLog")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void warn(String message) {
        logRepository.save(Log.builder()
                .level(LogLevel.WARN)
                .descripcion(message)
                .build());
    }

    @Async("taskLog")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void debug(String message) {
        logRepository.save(Log.builder()
                .level(LogLevel.DEBUG)
                .descripcion(message)
                .build());
    }

    @Async("taskLog")
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void trace(String message) {
        logRepository.save(Log.builder()
                .level(LogLevel.TRACE)
                .descripcion(message)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<Log> findAllByOrderByDateDesc(LocalDateTime pInit, LocalDateTime pEnd, Pageable pageable) {
        return logRepository.findAllByOrderByDateDesc(pInit, pEnd, pageable);
    }
}
