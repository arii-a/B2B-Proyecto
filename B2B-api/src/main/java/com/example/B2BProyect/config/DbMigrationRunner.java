package com.example.B2BProyect.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DbMigrationRunner implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE orden_compra DROP CONSTRAINT IF EXISTS chk_orden_estado");
            jdbcTemplate.execute("""
                ALTER TABLE orden_compra ADD CONSTRAINT chk_orden_estado
                CHECK (id_estado IN ('pendiente', 'aprobado', 'rechazado', 'cancelado', 'pagado'))
                """);
            log.info("[MIGRATION] Constraint chk_orden_estado actualizada correctamente.");
        } catch (Exception e) {
            log.warn("[MIGRATION] No se pudo actualizar chk_orden_estado: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE factura DROP CONSTRAINT IF EXISTS chk_factura_estado");
            jdbcTemplate.execute("""
                ALTER TABLE factura ADD CONSTRAINT chk_factura_estado
                CHECK (id_estado IN ('pendiente', 'pagado', 'anulado', 'emitido'))
                """);
            log.info("[MIGRATION] Constraint chk_factura_estado actualizada correctamente.");
        } catch (Exception e) {
            log.warn("[MIGRATION] No se pudo actualizar chk_factura_estado: {}", e.getMessage());
        }
    }
}
