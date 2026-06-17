package com.example.B2BProyect.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class MailContentBuilder {
    private final TemplateEngine templateEngine;

    @Autowired
    public MailContentBuilder(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String sendPassword(String password) {
        final Context ctx = new Context();
        ctx.setVariable("password", password);
        ctx.setVariable("imageResourceName", "banner");
        ctx.setVariable("imageX", "imageX");
        ctx.setVariable("imageLinkedin", "imageLinkedin");
        return this.templateEngine.process("mailPassword", ctx);
    }
}
