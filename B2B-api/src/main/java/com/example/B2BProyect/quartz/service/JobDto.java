package com.example.B2BProyect.quartz.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.scheduling.quartz.QuartzJobBean;

import java.io.Serializable;
import java.util.Date;


@Getter
@Setter
public class JobDto implements Serializable {
    /**
     * se usa tambien al momento de registrar un job
     */
    private String groupName;
    /**
     * se usa tambien al momento de registrar un job
     */
    private String jobName;

    private String triggerName;

    private Date scheduleTime;
    private Date lastFiredTime;
    private Date nextFireTime;
    private String jobStatus;
    private String description;
    private String cronExpression;

    /**
     * parametro auxiliar usado al momento de registrar un job
     */
    private String triggerKey;
    /**
     * parametro auxiliar usado al momento de registrar un job
     */
    private Class<? extends QuartzJobBean> jobClass;
}
