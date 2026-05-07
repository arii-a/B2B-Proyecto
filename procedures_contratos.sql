CREATE OR REPLACE PROCEDURE SP_AGREGAR_CONTRATO_EMPRESA_DETALLE(
    P_NOMBRE_EMPRESA VARCHAR,
    P_NOMBRE_PROVEEDOR VARCHAR,
    P_NOMBRE_REGLA VARCHAR,
    P_VIGENTE_DESDE TIMESTAMP,
    P_VIGENTE_HASTA TIMESTAMP,
    P_DETALLES JSONB
)
AS $$
DECLARE
    V_ID_EMPRESA UUID;
    V_ID_EMPRESA_PROVEEDORA UUID;
    V_ID_PROVEEDOR UUID;
    V_ID_REGLA UUID;
    V_ID_CONTRATO_NUEVO UUID;
    V_DETALLES JSONB;
    V_TIENE_NULL_GLOBAL BOOLEAN := FALSE;
    V_NUEVO_ES_NULL BOOLEAN := FALSE;
BEGIN
    -- verificar empresa compradora
    SELECT id_empresa
    INTO V_ID_EMPRESA
    FROM empresa
    WHERE LOWER(nombre) = LOWER(P_NOMBRE_EMPRESA);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La empresa % no existe', P_NOMBRE_EMPRESA;
    END IF;

    -- verificar proveedor
    SELECT p.id_proveedor
    INTO V_ID_PROVEEDOR
    FROM proveedor p
             JOIN empresa e ON e.id_empresa = p.id_empresa
    WHERE LOWER(e.nombre) = LOWER(P_NOMBRE_PROVEEDOR);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El proveedor % no existe', P_NOMBRE_PROVEEDOR;
    END IF;

    -- verificar tarifa
    SELECT tr.id_tarifa
    INTO V_ID_REGLA
    FROM tarifa_regla tr
    WHERE LOWER(tr.nombre) = LOWER(P_NOMBRE_REGLA)
      AND tr.id_proveedor = V_ID_PROVEEDOR;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La regla % no existe o no pertenece al proveedor %',
            P_NOMBRE_REGLA,
            P_NOMBRE_PROVEEDOR;
    END IF;

    -- verificar vigencias
    IF P_VIGENTE_HASTA IS NOT NULL
        AND P_VIGENTE_HASTA <= P_VIGENTE_DESDE THEN
        RAISE EXCEPTION 'La fecha vigente_hasta debe ser mayor que vigente_desde';
    END IF;

    IF P_DETALLES IS NULL OR jsonb_array_length(P_DETALLES) = 0 THEN
        RAISE EXCEPTION 'Debe enviar al menos un detalle para el contrato';
    END IF;

    -- verificar porcentajes
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_DETALLES) AS detalle
        WHERE (detalle->>'porcentaje_descuento')::DECIMAL(14,2) < 0
           OR (detalle->>'porcentaje_descuento')::DECIMAL(14,2) > 100
    ) THEN
        RAISE EXCEPTION 'El porcentaje de descuento no puede ser negativo o mayor a 100';
    END IF;

    -- verificar que los productos existan
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_DETALLES) AS detalle
            LEFT JOIN producto p ON p.sku = detalle->>'sku'
        WHERE (detalle->>'sku') IS NOT NULL
          AND (detalle->>'sku') <> ''
          AND p.sku IS NULL
    ) THEN
        RAISE EXCEPTION 'Uno o más productos del detalle no existen';
    END IF;

    -- detectar si el nuevo contrato trae sku null (aplica a todos)
    SELECT EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_DETALLES) AS detalle
        WHERE (detalle->>'sku') IS NULL OR (detalle->>'sku') = ''
    ) INTO V_NUEVO_ES_NULL;

    -- detectar si ya existe algún contrato activo con sku null para esta empresa+proveedor
    SELECT EXISTS (
        SELECT 1
        FROM contrato_empresa_tarifas cet
        JOIN contrato_empresa_detalle ced ON ced.id_contrato = cet.id_contrato
        WHERE cet.id_empresa   = V_ID_EMPRESA
          AND cet.id_proveedor = V_ID_PROVEEDOR
          AND cet.activo       = TRUE
          AND (cet.vigente_hasta IS NULL OR cet.vigente_hasta >= CURRENT_TIMESTAMP)
          AND ced.sku IS NULL
    ) INTO V_TIENE_NULL_GLOBAL;

    -- si ya existe un contrato con null, no se puede agregar ninguno más
    IF V_TIENE_NULL_GLOBAL THEN
        RAISE EXCEPTION 'Ya existe un contrato activo que aplica a todos los productos (SKU null). No se puede agregar otro contrato.';
    END IF;

    -- si el nuevo es null, no puede existir ningún otro contrato activo
    IF V_NUEVO_ES_NULL THEN
        IF EXISTS (
            SELECT 1
            FROM contrato_empresa_tarifas cet
            WHERE cet.id_empresa   = V_ID_EMPRESA
              AND cet.id_proveedor = V_ID_PROVEEDOR
              AND cet.activo       = TRUE
              AND (cet.vigente_hasta IS NULL OR cet.vigente_hasta >= CURRENT_TIMESTAMP)
        ) THEN
            RAISE EXCEPTION 'Ya existen contratos activos con productos específicos. No se puede agregar un contrato que aplique a todos (SKU null).';
        END IF;
    END IF;

    -- verificar que ningún SKU del nuevo contrato ya esté en un contrato activo
    IF NOT V_NUEVO_ES_NULL THEN
        FOR V_DETALLES IN SELECT * FROM jsonb_array_elements(P_DETALLES) LOOP
            IF EXISTS (
                SELECT 1
                FROM contrato_empresa_tarifas cet
                JOIN contrato_empresa_detalle ced ON ced.id_contrato = cet.id_contrato
                WHERE cet.id_empresa   = V_ID_EMPRESA
                  AND cet.id_proveedor = V_ID_PROVEEDOR
                  AND cet.activo       = TRUE
                  AND (cet.vigente_hasta IS NULL OR cet.vigente_hasta >= CURRENT_TIMESTAMP)
                  AND ced.sku = (V_DETALLES->>'sku')
            ) THEN
                RAISE EXCEPTION 'El producto % ya existe en un contrato activo.', (V_DETALLES->>'sku');
            END IF;
        END LOOP;
    END IF;

    -- insertar contrato
    INSERT INTO contrato_empresa_tarifas (
        id_empresa, id_proveedor, id_regla,
        vigente_desde, vigente_hasta, activo
    ) VALUES (
        V_ID_EMPRESA, V_ID_PROVEEDOR, V_ID_REGLA,
        P_VIGENTE_DESDE, P_VIGENTE_HASTA, TRUE
    )
    RETURNING id_contrato INTO V_ID_CONTRATO_NUEVO;

    -- insertar detalles
    INSERT INTO contrato_empresa_detalle (porcentaje_descuento, sku, id_contrato)
    SELECT
        (detalle->>'porcentaje_descuento')::DECIMAL(14,2),
        NULLIF(detalle->>'sku', ''),
        V_ID_CONTRATO_NUEVO
    FROM jsonb_array_elements(P_DETALLES) AS detalle;

    RAISE INFO 'Contrato creado correctamente. ID contrato: %', V_ID_CONTRATO_NUEVO;
END;
$$ LANGUAGE plpgsql;
