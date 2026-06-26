package com.example.B2BProyect.job;

import com.example.B2BProyect.quartz.service.JobDto;
import com.example.B2BProyect.service.OrdenCompraService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.QuartzJobBean;

@Slf4j
@DisallowConcurrentExecution
@PersistJobDataAfterExecution
public class OrdenExpiryJob extends QuartzJobBean implements InterruptableJob {

    public static final String NAME_JOB = "ORDEN_EXPIRY_JOB";
    private static final String NAME_TRIGGER = "OrdenExpiryJob-trigger";

    @Autowired
    private OrdenCompraService ordenCompraService;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        int canceladas = ordenCompraService.cancelarOrdenesPendientesVencidas(1);
        if (canceladas > 0)
            log.info("[OrdenExpiryJob] {} órdenes canceladas", canceladas);
    }

    public static JobDto getJobDto(String groupName) {
        JobDto jobDto = new JobDto();
        jobDto.setGroupName(groupName);
        jobDto.setJobName(NAME_JOB);
        jobDto.setTriggerKey(NAME_TRIGGER);
        jobDto.setJobClass(OrdenExpiryJob.class);
        return jobDto;
    }

    @Override
    public void interrupt() throws UnableToInterruptJobException {
        log.info("[OrdenExpiryJob] Deteniendo el hilo");
    }

    @Configuration
    static class OrdenExpiryJobConfig {

        @Bean
        public JobDetail ordenExpiryJobDetail() {
            return JobBuilder.newJob(OrdenExpiryJob.class)
                    .withIdentity("OrdenExpiryJob", "ordenes")
                    .withDescription("Rechaza órdenes pendientes con más de 1 minuto sin pagar")
                    .storeDurably()
                    .build();
        }

        @Bean
        public Trigger ordenExpiryTrigger(JobDetail ordenExpiryJobDetail) {
            return TriggerBuilder.newTrigger()
                    .forJob(ordenExpiryJobDetail)
                    .withIdentity("OrdenExpiryTrigger", "ordenes")
                    .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                            .withIntervalInSeconds(5)
                            .repeatForever())
                    .build();
        }
    }
}
