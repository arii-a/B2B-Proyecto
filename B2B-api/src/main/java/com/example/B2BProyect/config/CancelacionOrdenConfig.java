package com.example.B2BProyect.config;

import com.example.B2BProyect.job.CancelacionOrdenJob;
import com.example.B2BProyect.quartz.CronExpressionConstant;
import com.example.B2BProyect.quartz.service.JobService;
import com.example.B2BProyect.service.exception.OperationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;

import java.util.Date;
import java.util.HashMap;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class CancelacionOrdenConfig {
    private final JobService jobService;

    @EventListener(ApplicationReadyEvent.class)
    public void scheduleCancelacionJob() {
        try {
            jobService.scheduleCronJob(
                    CancelacionOrdenJob.getJobDto("CANCELACION"),
                    new Date(),
                    CronExpressionConstant.CRON_START_NOW,
                    new HashMap<>(),
                    "Auto-cancelacion de órdenes no pagas cada 5s"
            );
            log.info("[CANCELACION] Job de cancelada de ordenes programado exitosamente cada 5 seg");
        } catch (OperationException e) {
            log.error("[CANCELACION] Error al programar el job de cancelacion: {}", e.getMessage(), e);
        }
    }
}
