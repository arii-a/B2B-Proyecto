package com.example.B2BProyect.config;

import com.example.B2BProyect.repository.entity.DetalleOrden;
import com.example.B2BProyect.repository.entity.Factura;
import com.example.B2BProyect.utils.InvoiceItems;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Component
public class MailContentBuilder {
    private final TemplateEngine templateEngine;

    @Autowired
    public MailContentBuilder(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String build(String message) {
        Context context = new Context();
        context.setVariable("message", message);
        return templateEngine.process("mailTemplate", context);
    }

    public String sendPassword(String password) {
        final Context ctx = new Context();
        ctx.setVariable("password", password);
        ctx.setVariable("imageResourceName", "banner");
        ctx.setVariable("imageX", "imageX");
        ctx.setVariable("imageLinkedin", "imageLinkedin");
        return this.templateEngine.process("mailPassword", ctx);
    }

    public String sendFactura(Factura factura) {
        String empresaName = factura.getIdOrden().getIdEmpresaCompradora().getNombre();
        List<InvoiceItems> items = new ArrayList<>();
        for (DetalleOrden detalleOrden : factura.getIdOrden().getDetalleOrdens()) {
            String description = detalleOrden.getIdProducto().getNombre();;
            String quantity = detalleOrden.getCantidad().toString();;
            String formattedPrice = "Bs. " + String.valueOf(detalleOrden.getPrecioUnitario().multiply(BigDecimal.valueOf(detalleOrden.getCantidad())));
            items.add(new InvoiceItems(description, quantity, formattedPrice));
        }
        final Context ctx = new Context();
        ctx.setVariable("password", "password");
        ctx.setVariable("imageResourceName", "banner");
        ctx.setVariable("imageX", "imageX");
        ctx.setVariable("imageLinkedin", "imageLinkedin");
        ctx.setVariable("customerName", empresaName);
        ctx.setVariable("invoiceNumber", factura.getId());
        ctx.setVariable("paymentMethod", "VALIDABLE");
        ctx.setVariable("fiscalName", empresaName);
        ctx.setVariable("fiscalId", factura.getIdOrden().getIdEmpresaCompradora().getNit());
        ctx.setVariable("totalAmount", factura.getIdOrden().getTotal());
        ctx.setVariable("downloadPdfUrl", "Empty");
        ctx.setVariable("invoiceItems", items);

        return this.templateEngine.process("mailFactura", ctx);
    }

}

