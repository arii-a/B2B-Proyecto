package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.*;
import com.example.B2BProyect.repository.entity.OrdenCompra;
import com.example.B2BProyect.repository.entity.Usuario;
import com.example.B2BProyect.service.OrdenCompraService;
import com.example.B2BProyect.service.StereumService;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.HmacAlgorithms;
import org.apache.commons.codec.digest.HmacUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.springframework.http.ResponseEntity.ok;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/stereum")
public class StereumController {

    private ConcurrentHashMap<UUID, String> clientes = new ConcurrentHashMap();
    @Value("${stereum.api_key}")
    private String secretKey;

    private final SistemaB2B sistemaB2B;
    private final OrdenCompraService ordenCompraService;

    @PostMapping("/charge")
    public ResponseEntity<?> charge(@RequestBody PaymentRequest request) {
        OrdenCompra ordenCompra = ordenCompraService.findById(request.getOrderId()).get();
        try {
            Customer customer = new Customer(
                    ordenCompra.getIdUsuario().getNombre(),
                    "Laredo",
                    "76887344");
            StereumApiRequest req = new StereumApiRequest(
                    "BO",
                    String.valueOf(ordenCompra.getTotal()),
                    "USDT",
                    "POLYGON",
                    "COMPRA A: " + ordenCompra.getIdProveedor().getIdEmpresa().getNombre(),
                    ordenCompra.getId().toString(),
                    "10",
                    customer
            );
            ;
//            Usuario user = (Usuario) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
//            clientes.put(request.getOrderId(), user.getNombre());
            log.info(clientes.toString());
            return ok(sistemaB2B.callStereum(req));
        } catch (Exception e) {
            log.error("Error generando QR Stereum: {}", e.getMessage());
            String msg = e.getMessage() != null ? e.getMessage() : "Error al conectar con Stereum";
            return ResponseEntity.badRequest().body(Map.of("message", msg));
        }
    }

    @Autowired
    private SimpMessagingTemplate template;
    @PostMapping(value = "/outbound", produces = MediaType.APPLICATION_JSON_VALUE, consumes = {MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<Void> outbound(
            @RequestHeader("X-Signature") String signature,
            @RequestHeader("X-Timestamp") int tiempo,
            @RequestBody String body) throws Exception {

        final ObjectMapper mapper = new ObjectMapper();

        String hmac = new HmacUtils(HmacAlgorithms.HMAC_SHA_256,
                secretKey.getBytes(StandardCharsets.UTF_8))
                .hmacHex(body.getBytes(StandardCharsets.UTF_8));

        if (!signature.equals(hmac)) {
            throw new Exception("MessageCode.SIGN_REQUEST_INVALID");
        }

//        if (System.currentTimeMillis() / 1000 - tiempo >= 3000)
//            throw new Exception("MessageCode.TIEMPO_INVALIDO");

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        StereumPayResponse response = objectMapper.readValue(body, StereumPayResponse.class);

//        template.convertAndSendToUser(clientes.get(response.getTransaction().getIdempotencyKey()),"/paymenting", response.getTransaction().getStatus());
        try {
            return ok().build();
        } catch (Exception e) {
            throw e ;
        }
    }

}
