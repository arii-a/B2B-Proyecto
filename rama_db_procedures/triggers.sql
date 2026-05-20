-- ============================================================
-- T2: Sin cambios — la procedure no cancela órdenes,
--     ese flujo solo ocurre por UPDATE directo al estado.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_revertir_stock_por_orden()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.id_estado = 'cancelado' AND OLD.id_estado <> 'cancelado' THEN

        UPDATE producto_almacen pa
        SET    stock = pa.stock + dord.cantidad
        FROM   detalle_orden dord
                   JOIN   almacen a ON a.id_proveedor = NEW.id_proveedor
        WHERE  dord.id_orden  = NEW.id_orden
          AND  dord.id_almacen = pa.id_almacen
          AND  pa.id_almacen  = a.id_almacen
          AND  pa.sku         = dord.sku;

    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_revertir_stock_orden
    AFTER UPDATE OF id_estado ON orden_compra
    FOR EACH ROW EXECUTE FUNCTION fn_revertir_stock_por_orden();

-- ============================================================
-- T3: Sin cambios — ninguna procedure aprueba órdenes.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_generar_factura()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_id_factura UUID;
BEGIN
    IF NEW.id_estado = 'aprobado' AND OLD.id_estado <> 'aprobado' THEN
        INSERT INTO factura (fecha, total, id_orden, id_estado)
        VALUES (NOW(), NEW.total, NEW.id_orden, 'pendiente')
        RETURNING id_factura INTO v_id_factura;

        INSERT INTO detalle_factura (cantidad, precio_unitario, subtotal, id_factura, sku)
        SELECT cantidad, precio_unitario, subtotal, v_id_factura, sku
        FROM   detalle_orden
        WHERE  id_orden = NEW.id_orden;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_generar_factura
    AFTER UPDATE OF id_estado ON orden_compra
    FOR EACH ROW EXECUTE FUNCTION fn_generar_factura();


-- ============================================================
-- T4: Sin cambios — ninguna procedure anula facturas.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_anular_factura()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.id_estado = 'anulada' AND OLD.id_estado <> 'anulada' THEN

        -- Cancelar la orden asociada
        UPDATE orden_compra
        SET    id_estado = 'cancelado'
        WHERE  id_orden  = NEW.id_orden
          AND  id_estado <> 'cancelado';

    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_anular_factura
    AFTER UPDATE OF id_estado ON factura
    FOR EACH ROW EXECUTE FUNCTION fn_anular_factura();


-- ============================================================
-- T5: Sin cambios — ninguna procedure toca el estado de factura.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_bloquear_anulacion_pagada()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF OLD.id_estado = 'pagada' AND NEW.id_estado = 'anulada' THEN
        RAISE EXCEPTION
            'No se puede anular la factura % porque ya está pagada.',
            OLD.id_factura;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_bloquear_anulacion_pagada
    BEFORE UPDATE OF id_estado ON factura
    FOR EACH ROW EXECUTE FUNCTION fn_bloquear_anulacion_pagada();



-- ============================================================
-- T7: Se mantiene, pero con mensaje alineado al estilo
--     de la procedure para no confundir al usuario.
--     Protege también contra INSERTs directos a la tabla.
-- ============================================================
CREATE OR REPLACE FUNCTION fn_validar_tramo_tarifa()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_conflicto UUID;
BEGIN
    SELECT id_tramo INTO v_conflicto
    FROM   tramo_tarifa
    WHERE  id_regla  = NEW.id_regla
      AND  tipo      = NEW.tipo
      AND  id_tramo <> COALESCE(NEW.id_tramo, '00000000-0000-0000-0000-000000000000'::UUID)
      AND  cantidad_minima < COALESCE(NEW.cantidad_maxima, 'infinity'::NUMERIC)
      AND  COALESCE(cantidad_maxima, 'infinity'::NUMERIC) > NEW.cantidad_minima
    LIMIT 1;

    IF FOUND THEN
        RAISE EXCEPTION 'Tramos sobrepuestos: el rango [% – %] de tipo "%" solapa con tramo existente %.',
            NEW.cantidad_minima, NEW.cantidad_maxima, NEW.tipo, v_conflicto;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_validar_tramo_tarifa
    BEFORE INSERT OR UPDATE ON tramo_tarifa
    FOR EACH ROW EXECUTE FUNCTION fn_validar_tramo_tarifa();

--------------------------------------
-- CREAR COMISION
--------------------------------------
CREATE OR REPLACE FUNCTION fn_generar_comisiones()
    RETURNS TRIGGER AS $$
DECLARE
    V_REGLA         RECORD;
    V_DETALLE       RECORD;
    V_MONTO_COMISION    DECIMAL(14,2);
    V_MONTO_PROVEEDOR   DECIMAL(14,2);
BEGIN
    -- solo actuar cuando el estado cambia a 'aprobado'
    IF NEW.id_estado != 'aprobado' OR OLD.id_estado = 'aprobado' THEN
        RETURN NEW;
    END IF;

    -- buscar regla de comision activa del proveedor
    SELECT id_regla, id_tipo, valor
    INTO V_REGLA
    FROM reglas_comision
    WHERE id_proveedor = NEW.id_proveedor
      AND activa = TRUE
      AND (fecha_final IS NULL OR fecha_final >= CURRENT_TIMESTAMP)
    ORDER BY fecha_inicio DESC
    LIMIT 1;

    IF V_REGLA IS NULL THEN
        RAISE EXCEPTION 'No existe una regla de comisión activa para el proveedor %', NEW.id_proveedor;
    END IF;

    -- por cada línea de detalle_orden, generar una comision
    FOR V_DETALLE IN
        SELECT id_detalle, subtotal
        FROM detalle_orden
        WHERE id_orden = NEW.id_orden
        LOOP
            -- calcular montos según tipo de regla
            IF V_REGLA.id_tipo = 'porcentaje' THEN
                V_MONTO_COMISION  := ROUND(V_DETALLE.subtotal * V_REGLA.valor / 100, 2);
            ELSIF V_REGLA.id_tipo = 'fijo' THEN
                V_MONTO_COMISION  := V_REGLA.valor;
            END IF;

            V_MONTO_PROVEEDOR := V_DETALLE.subtotal - V_MONTO_COMISION;

            -- insertar comision
            INSERT INTO comision (
                monto_comision,
                monto_proveedor,
                fecha,
                id_detalle_orden,
                id_proveedor,
                id_regla
            )
            VALUES (
                       V_MONTO_COMISION,
                       V_MONTO_PROVEEDOR,
                       CURRENT_TIMESTAMP,
                       V_DETALLE.id_detalle,
                       NEW.id_proveedor,
                       V_REGLA.id_regla
                   );
        END LOOP;

    RAISE INFO 'Comisiones generadas para la orden % usando regla %',
        NEW.id_orden, V_REGLA.id_regla;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger sobre orden_compra al actualizar el estado

CREATE OR REPLACE TRIGGER trg_generar_comisiones
    AFTER UPDATE OF id_estado ON orden_compra
    FOR EACH ROW
EXECUTE FUNCTION fn_generar_comisiones();

-------------------------
-- TRIGGER MOVIMIENTOS
-------------------------
CREATE OR REPLACE FUNCTION fn_movimientos()
    RETURNS TRIGGER AS $$
DECLARE
V_ESTADO VARCHAR(50);
V_MONTO DECIMAL(14,2);
BEGIN
SELECT id_estado, total
INTO V_ESTADO, V_MONTO
FROM orden_compra
WHERE id_orden = NEW.id_orden;

IF V_ESTADO = 'cancelado' THEN
INSERT INTO movimientos(fecha, tipo, monto, motivo)
VALUES (CURRENT_DATE, 'DEBITO', -V_MONTO, 'Anulación de venta');
RETURN NEW;
END IF;

INSERT INTO movimientos(fecha, tipo, monto, motivo)
VALUES (CURRENT_DATE, 'CREDITO', V_MONTO, 'Movimiento');

RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER trg_generar_comisiones ON orden_compra;
CREATE OR REPLACE TRIGGER trg_generar_movimientos
    AFTER INSERT OR UPDATE ON orden_compra
    FOR EACH ROW
EXECUTE FUNCTION fn_movimientos();

