package com.example.B2BProyect.service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfGeneratorService {

    private final TemplateEngine templateEngine;

    public byte[] generateFacturaPdf(FacturaEmailData data) {
        try {
            Context ctx = new Context();
            ctx.setVariable("facturaId", data.getFacturaId().toString().substring(0, 8).toUpperCase());
            ctx.setVariable("ordenId", data.getOrdenId().toString().substring(0, 8).toUpperCase());
            ctx.setVariable("fecha", data.getFecha());
            ctx.setVariable("estado", data.getEstado());
            ctx.setVariable("compradoraNombre", data.getCompradoraNombre());
            ctx.setVariable("compradoraNit", data.getCompradoraNit() != null ? data.getCompradoraNit() : "—");
            ctx.setVariable("proveedorNombre", data.getProveedorNombre());
            ctx.setVariable("proveedorNit", data.getProveedorNit() != null ? data.getProveedorNit() : "—");
            ctx.setVariable("total", data.getTotal());
            ctx.setVariable("items", data.getItems());

            String html = templateEngine.process("factura-pdf", ctx);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.withHtmlContent(html, null);
            builder.toStream(baos);
            builder.run();

            return baos.toByteArray();
        } catch (Exception e) {
            log.error("[PDF] Error generando PDF de factura: {}", e.getMessage(), e);
            return new byte[0];
        }
    }
}
