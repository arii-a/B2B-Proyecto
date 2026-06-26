package com.example.B2BProyect.job;

import com.example.B2BProyect.quartz.service.JobDto;
import com.example.B2BProyect.repository.OrdenCompraRepository;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import com.example.B2BProyect.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.util.List;

@Slf4j
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class CancelacionOrdenJob extends QuartzJobBean implements InterruptableJob {

    @Autowired
    private OrdenCompraRepository ordenCompraRepository;

    @Autowired
    private EmailService emailService;

    @Override
    protected void executeInternal(JobExecutionContext context) throws JobExecutionException {
        log.info("[CANCELACION] Verificando ordenes no pagas");
        List<OrdenCompra> unpaid = ordenCompraRepository.findUnpaidOrders();
        if (unpaid.isEmpty()) {
            log.info("[CANCELACION] No hay ordenes pendientes de pago.");
            return;
        }
        for (OrdenCompra orden : unpaid) {
            orden.setIdEstado("cancelado");
            ordenCompraRepository.save(orden);
            log.info("[CANCELACION] Orden {} cancelada.", orden.getId());
        }
        emailService.sendPedidoCancelado("rllayus@gmail.com");
        log.info("[CANCELACION] {} ordenes cancelada.", unpaid.size());
    }

    public static JobDto getJobDto(String groupName) {
        JobDto jobDto = new JobDto();
        jobDto.setGroupName(groupName);
        jobDto.setJobName("CANCELACION_ORDEN_JOB");
        jobDto.setTriggerKey("CancelacionOrdenJob-trigger");
        jobDto.setJobClass(CancelacionOrdenJob.class);
        return jobDto;
    }

    @Override
    public void interrupt() throws UnableToInterruptJobException {
        log.info("[CANCELACION] Job interrumpido.");
    }
}
