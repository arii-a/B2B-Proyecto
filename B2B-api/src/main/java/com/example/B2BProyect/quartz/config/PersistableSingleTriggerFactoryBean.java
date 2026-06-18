package com.example.B2BProyect.quartz.config;

import org.springframework.scheduling.quartz.SimpleTriggerFactoryBean;

/**
 * Needed to set Quartz useProperties=true when using Spring classes,
 * because Spring sets an object reference on JobDataMap that is not a String
 * 
 * @see http://site.trimplement.com/using-spring-and-quartz-with-jobstore-properties/
 * @see http://forum.springsource.org/showthread.php?130984-Quartz-error-IOException
 */
public class PersistableSingleTriggerFactoryBean extends SimpleTriggerFactoryBean {
	public static final String JOB_DETAIL_KEY = "jobDetail";
	
    @Override
    public void afterPropertiesSet()  {
        super.afterPropertiesSet();
        getJobDataMap().remove(JOB_DETAIL_KEY);
    }


}
