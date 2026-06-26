package com.example.B2BProyect.service;

import com.example.B2BProyect.config.MailContentBuilder;
import com.example.B2BProyect.repository.entity.Factura;
import jakarta.mail.internet.InternetAddress;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.mail.javamail.MimeMessagePreparator;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ConcurrentHashMap;

@RequiredArgsConstructor
@Slf4j
@Service
public class EmailService {
    private static final String BANNER_PNG = "images/upb.png";
    private static final String LINKEDIN_PNG = "images/linkedin@2x.png";
    private static final String X_PNG = "images/twitter@2x.png";
    private final ConcurrentHashMap<String, Factura> facturaList = new ConcurrentHashMap<>();
    private final PdfGeneratorService pdfGeneratorService;

    @Value("${mail.smtp.from-mail}")
    private String mailFrom;
    @Value("${mail.smtp.mail-noreply}")
    private String mailNoreply;
    private final MailContentBuilder mailContentBuilder;
    @Autowired
    @Qualifier("javaMailSender")
    private JavaMailSender javaMailSender;

    @Async("taskLog")
    public void sendPasswordResetCode(String to, String code) {
        MimeMessagePreparator messagePreparator = mimeMessage -> {
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            messageHelper.setTo(to);
            messageHelper.setFrom(new InternetAddress(mailFrom));
            messageHelper.setReplyTo(new InternetAddress(mailNoreply, mailNoreply));
            messageHelper.setSubject("Código de restablecimiento de contraseña");
            String message = mailContentBuilder.sendResetCode(code);
            messageHelper.setText(message, true);
            messageHelper.addInline("banner", new ClassPathResource(BANNER_PNG));
            messageHelper.addInline("imageLinkedin", new ClassPathResource(LINKEDIN_PNG));
            messageHelper.addInline("imageX", new ClassPathResource(X_PNG));
        };
        javaMailSender.send(messagePreparator);
    }

    @Async("taskLog")
    public void sendPassword(String to, String password) {
        MimeMessagePreparator messagePreparator = mimeMessage -> {
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            messageHelper.setTo(to);
            messageHelper.setFrom(new InternetAddress(mailFrom));
            messageHelper.setReplyTo(new InternetAddress(mailNoreply, mailNoreply));
            messageHelper.setSubject("Password reset");
            String message = mailContentBuilder.sendPassword(password);

            messageHelper.setText(message, true);
            messageHelper.addInline("banner", new ClassPathResource(BANNER_PNG));
            messageHelper.addInline("imageLinkedin", new ClassPathResource(LINKEDIN_PNG));
            messageHelper.addInline("imageX", new ClassPathResource(X_PNG));
        };
        javaMailSender.send(messagePreparator);
    }

    @Async("taskLog")
    public void sendFactura(String to, Factura factura) {
        MimeMessagePreparator messagePreparator = mimeMessage -> {
            MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            messageHelper.setTo(to);
            messageHelper.setFrom(new InternetAddress(mailFrom));
            messageHelper.setReplyTo(new InternetAddress(mailNoreply, mailNoreply));
            messageHelper.setSubject("Verification sent");
            String message = mailContentBuilder.sendFactura(factura);

            messageHelper.setText(message, true);
            messageHelper.addInline("banner", new ClassPathResource(BANNER_PNG));
            messageHelper.addInline("imageLinkedin", new ClassPathResource(LINKEDIN_PNG));
            messageHelper.addInline("imageX", new ClassPathResource(X_PNG));
        };
        javaMailSender.send(messagePreparator);
    }

    @Async("taskLog")
    public void sendFacturaConPdf(String to, FacturaEmailData data) {
        try {
            log.info("[EMAIL] Enviando factura PDF a {}", to);
            byte[] pdfBytes = pdfGeneratorService.generateFacturaPdf(data);
            MimeMessagePreparator prep = mimeMessage -> {
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setTo(to);
                helper.setFrom(new InternetAddress(mailFrom));
                helper.setReplyTo(new InternetAddress(mailNoreply, mailNoreply));
                helper.setSubject("Factura de compra – Marketplace B2B");
                String body = "<div style='font-family:Arial,sans-serif;color:#1a1a2e;'>"
                        + "<h2 style='color:#1e3a5f;'>Marketplace B2B</h2>"
                        + "<p>Hola,</p>"
                        + "<p>Se ha generado una nueva factura correspondiente a tu orden. Encontrarás el detalle completo en el PDF adjunto.</p>"
                        + "<table style='margin:16px 0;border-collapse:collapse;'>"
                        + "<tr><td style='padding:4px 12px 4px 0;color:#555;'>Factura N°</td><td style='font-weight:bold;'>" + data.getFacturaId().toString().substring(0, 8).toUpperCase() + "</td></tr>"
                        + "<tr><td style='padding:4px 12px 4px 0;color:#555;'>Fecha</td><td style='font-weight:bold;'>" + data.getFecha() + "</td></tr>"
                        + "<tr><td style='padding:4px 12px 4px 0;color:#555;'>Total</td><td style='font-weight:bold;color:#1e3a5f;'>Bs. " + data.getTotal() + "</td></tr>"
                        + "</table>"
                        + "<p style='color:#555;font-size:12px;'>Este correo fue generado automáticamente por Marketplace B2B.</p>"
                        + "</div>";
                helper.setText(body, true);
                if (pdfBytes.length > 0) {
                    helper.addAttachment("factura-" + data.getFacturaId().toString().substring(0, 8).toUpperCase() + ".pdf",
                            new ByteArrayResource(pdfBytes), "application/pdf");
                }
            };
            javaMailSender.send(prep);
            log.info("[EMAIL] Factura enviada exitosamente a {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] Error enviando factura a {}: {}", to, e.getMessage(), e);
        }
    }

    @Async("taskLog")
    public void sendStockAlerta(String to, String productoNombre, int stockActual, int stockMinimo, String almacenNombre) {
        try {
            log.info("[EMAIL] Enviando alerta de stock bajo a {} — producto '{}' ({}/{})", to, productoNombre, stockActual, stockMinimo);
            MimeMessagePreparator messagePreparator = mimeMessage -> {
                MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                messageHelper.setTo(to);
                messageHelper.setFrom(new InternetAddress(mailFrom));
                messageHelper.setReplyTo(new InternetAddress(mailNoreply, mailNoreply));
                messageHelper.setSubject("⚠️ Stock bajo: " + productoNombre);
                String message = mailContentBuilder.sendStockAlerta(productoNombre, stockActual, stockMinimo, almacenNombre);
                messageHelper.setText(message, true);
                messageHelper.addInline("banner", new ClassPathResource(BANNER_PNG));
                messageHelper.addInline("imageLinkedin", new ClassPathResource(LINKEDIN_PNG));
                messageHelper.addInline("imageX", new ClassPathResource(X_PNG));
            };
            javaMailSender.send(messagePreparator);
            log.info("[EMAIL] Alerta de stock enviada exitosamente a {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] Fallo al enviar alerta de stock a {}: {}", to, e.getMessage(), e);
        }
    }

    @Async("taskLog")
    public void sendPedidoCancelado(String to) {
        try {
            MimeMessagePreparator messagePreparator = mimeMessage -> {
                MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, false, "UTF-8");
                messageHelper.setTo(to);
                messageHelper.setFrom(new InternetAddress(mailFrom));
                messageHelper.setSubject("Pregunta 6-A");
                messageHelper.setText("Pedido Cancelado", false);
            };
            javaMailSender.send(messagePreparator);
            log.info("[EMAIL] Notificación de pedido cancelado enviada a {}", to);
        } catch (Exception e) {
            log.error("[EMAIL] Error al enviar notificación de cancelación a {}: {}", to, e.getMessage(), e);
        }
    }

    @Async("taskLog")
    public void sendSolicitudProveedor(String adminEmail, String empresaNombre, String logoUrl, String nit) {
        try {
            log.info("[EMAIL] Enviando notificación de solicitud proveedor a {} para empresa {}", adminEmail, empresaNombre);

            // Descargar el logo y adjuntarlo como inline CID para que sea visible en cualquier cliente de email
            byte[] logoBytes = null;
            String logoMime  = "image/png";
            String efectivoLogoUrl = null;

            if (logoUrl != null && !logoUrl.isBlank()) {
                try {
                    HttpURLConnection conn = (HttpURLConnection) new URL(logoUrl).openConnection();
                    conn.setConnectTimeout(4000);
                    conn.setReadTimeout(4000);
                    logoBytes = conn.getInputStream().readAllBytes();
                    String ct = conn.getContentType();
                    if (ct != null && ct.startsWith("image/")) logoMime = ct.split(";")[0].trim();
                    efectivoLogoUrl = "cid:logoEmpresa";
                    log.info("[EMAIL] Logo descargado correctamente ({} bytes)", logoBytes.length);
                } catch (Exception ex) {
                    log.warn("[EMAIL] No se pudo descargar el logo '{}': {}", logoUrl, ex.getMessage());
                }
            }

            final byte[] finalLogoBytes    = logoBytes;
            final String finalLogoMime     = logoMime;
            final String finalLogoUrl      = efectivoLogoUrl;

            MimeMessagePreparator messagePreparator = mimeMessage -> {
                MimeMessageHelper messageHelper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                messageHelper.setTo(adminEmail);
                messageHelper.setFrom(new InternetAddress(mailFrom));
                messageHelper.setReplyTo(new InternetAddress(mailNoreply, mailNoreply));
                messageHelper.setSubject("Nueva solicitud de proveedor: " + empresaNombre);
                String message = mailContentBuilder.sendSolicitudProveedor(empresaNombre, finalLogoUrl, nit);
                messageHelper.setText(message, true);
                messageHelper.addInline("banner", new ClassPathResource(BANNER_PNG));
                messageHelper.addInline("imageLinkedin", new ClassPathResource(LINKEDIN_PNG));
                messageHelper.addInline("imageX", new ClassPathResource(X_PNG));
                if (finalLogoBytes != null) {
                    messageHelper.addInline("logoEmpresa", new ByteArrayResource(finalLogoBytes), finalLogoMime);
                }
            };
            javaMailSender.send(messagePreparator);
            log.info("[EMAIL] Notificación enviada exitosamente a {}", adminEmail);
        } catch (Exception e) {
            log.error("[EMAIL] Fallo al enviar notificación de proveedor a {}: {}", adminEmail, e.getMessage(), e);
        }
    }

}
