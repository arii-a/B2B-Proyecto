package com.example.B2BProyect.service;

import com.example.B2BProyect.integracion.SistemaB2B;
import com.example.B2BProyect.integracion.stereum.StereumVerifyResponse;
import com.example.B2BProyect.repository.dto.request.OrdenCompraRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StereumPollingService {

    private final SistemaB2B sistemaB2B;
    private final SimpMessagingTemplate template;
    private final FacturaService facturaService;
    private final OrdenCompraService ordenCompraService;

    private static final int POLL_INTERVAL_MS = 5000;
    private static final int MAX_POLLS = 120; // 10 minutos

    @Async
    public void pollUntilComplete(String stereumTxId, UUID ordenId) {
        log.info("[STEREUM-POLL] Iniciando polling para tx={} orden={}", stereumTxId, ordenId);
        for (int i = 0; i < MAX_POLLS; i++) {
            try {
                Thread.sleep(POLL_INTERVAL_MS);
                StereumVerifyResponse verify = sistemaB2B.verifyCharge(stereumTxId);
                String status = verify != null ? verify.getStatus() : null;
                log.info("[STEREUM-POLL] tx={} status={}", stereumTxId, status);

                if (status == null) continue;

                template.convertAndSend("/paymenting/" + ordenId, status);

                if ("COMPLETED".equalsIgnoreCase(status) || "PAGADO".equalsIgnoreCase(status)) {
                    try {
                        OrdenCompraRequest estadoReq = new OrdenCompraRequest();
                        estadoReq.setIdEstado("pagado");
                        ordenCompraService.update(ordenId, estadoReq);
                    } catch (Exception ex) {
                        log.warn("[STEREUM-POLL] No se pudo actualizar estado orden {}: {}", ordenId, ex.getMessage());
                    }
                    try {
                        facturaService.saveFromPayment(ordenId);
                    } catch (Exception ex) {
                        log.error("[STEREUM-POLL] Error generando factura para orden {}: {}", ordenId, ex.getMessage());
                    }
                    return;
                }

                if ("CANCELADO".equalsIgnoreCase(status) || "ERROR".equalsIgnoreCase(status)) {
                    log.warn("[STEREUM-POLL] Pago terminado con status={} para orden={}", status, ordenId);
                    return;
                }

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.warn("[STEREUM-POLL] Polling interrumpido para tx={}", stereumTxId);
                return;
            } catch (org.springframework.web.client.HttpClientErrorException e) {
                if (e.getStatusCode().value() == 403 || e.getStatusCode().value() == 401) {
                    log.warn("[STEREUM-POLL] Sin permisos para verify ({}). Polling cancelado. Usa el botón 'Confirmar pago' manualmente.", e.getStatusCode().value());
                    return;
                }
                log.warn("[STEREUM-POLL] Error consultando verify tx={}: {}", stereumTxId, e.getMessage());
            } catch (Exception e) {
                log.warn("[STEREUM-POLL] Error consultando verify tx={}: {}", stereumTxId, e.getMessage());
            }
        }
        log.warn("[STEREUM-POLL] Timeout de polling para tx={} orden={}", stereumTxId, ordenId);
    }
}
