package com.example.B2BProyect.job;

import com.example.B2BProyect.quartz.service.JobDto;
import com.example.B2BProyect.quartz.service.JobService;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.scheduling.quartz.QuartzJobBean;


@Slf4j
@PersistJobDataAfterExecution
@DisallowConcurrentExecution
public class EmailSenderJob extends QuartzJobBean implements InterruptableJob {
    public static final String NAME_JOB = "STEVE_JOB";
    private static final String NAME_TRIGGER = "EmailSenderJob-trigger";
    private JobService jobService;
    private static int count = 0;

    @SneakyThrows
    @Override
    protected void executeInternal(JobExecutionContext jobExecutionContext) throws JobExecutionException {
        JobKey key = jobExecutionContext.getJobDetail().getKey();
        JobDataMap dataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        System.out.println("How many are now? " + count);
        count += 1;
    }


    public static JobDto getJobDto(String groupName) {
        JobDto jobDto = new JobDto();
        jobDto.setGroupName(groupName);
        jobDto.setJobName(NAME_JOB);
        jobDto.setTriggerKey(NAME_TRIGGER);
        jobDto.setJobClass(EmailSenderJob.class);
        return jobDto;
    }

    @Override
    public void interrupt() throws UnableToInterruptJobException {
        log.info("Deteniendo el hilo ");
    }

}
