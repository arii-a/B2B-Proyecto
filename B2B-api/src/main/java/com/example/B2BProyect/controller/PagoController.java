package com.example.B2BProyect.controller;

import com.example.B2BProyect.integracion.SistemaB2B;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    @Autowired
    private SistemaB2B sistemaB2B;

    @PostMapping("/crear-cobro")
    public ResponseEntity<?> crearCobro(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(sistemaB2B.callStereum(new JSONObject(body)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
