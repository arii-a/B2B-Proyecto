CREATE OR REPLACE PROCEDURE SP_AGREGAR_TRAMOS_A_REGLA_TARIFA(
    P_NOMBRE_PROVEEDOR VARCHAR,
    P_NOMBRE_REGLA VARCHAR,
    P_TRAMOS JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    V_ID_EMPRESA UUID;
    V_ID_PROVEEDOR UUID;
    V_ID_REGLA UUID;
BEGIN
    SELECT id_empresa
    INTO V_ID_EMPRESA
    FROM empresa
    WHERE LOWER(nombre) = LOWER(P_NOMBRE_PROVEEDOR)
      AND activo = TRUE;

    IF V_ID_EMPRESA IS NULL THEN
        RAISE EXCEPTION 'No existe empresa proveedora activa con nombre %', P_NOMBRE_PROVEEDOR;
    END IF;

    SELECT id_proveedor
    INTO V_ID_PROVEEDOR
    FROM proveedor
    WHERE id_empresa = V_ID_EMPRESA
      AND activo = TRUE;

    IF V_ID_PROVEEDOR IS NULL THEN
        RAISE EXCEPTION 'La empresa % no está registrada como proveedor activo', P_NOMBRE_PROVEEDOR;
    END IF;

    SELECT id_tarifa
    INTO V_ID_REGLA
    FROM tarifa_regla
    WHERE LOWER(nombre) = LOWER(P_NOMBRE_REGLA)
      AND id_proveedor = V_ID_PROVEEDOR
      AND activo = TRUE;

    IF V_ID_REGLA IS NULL THEN
        RAISE EXCEPTION 'La regla % no existe o no pertenece al proveedor %',
            P_NOMBRE_REGLA,
            P_NOMBRE_PROVEEDOR;
    END IF;

    IF P_TRAMOS IS NULL OR jsonb_array_length(P_TRAMOS) = 0 THEN
        RAISE EXCEPTION 'Debe enviar al menos un tramo';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_TRAMOS) t
        WHERE t->>'tipo' NOT IN ('volumen', 'costo')
    ) THEN
        RAISE EXCEPTION 'Tipo inválido. Solo se permite volumen o costo';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_TRAMOS) t
        WHERE t->>'cantidad_minima' IS NULL
           OR t->>'cantidad_minima' = ''
           OR (t->>'cantidad_minima')::DECIMAL(14,2) < 0
    ) THEN
        RAISE EXCEPTION 'cantidad_minima inválida';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_TRAMOS) t
        WHERE t->>'cantidad_maxima' IS NOT NULL
          AND t->>'cantidad_maxima' <> ''
          AND (t->>'cantidad_maxima')::DECIMAL(14,2) <= (t->>'cantidad_minima')::DECIMAL(14,2)
    ) THEN
        RAISE EXCEPTION 'cantidad_maxima debe ser mayor a cantidad_minima';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_TRAMOS) t
        WHERE t->>'porcentaje_desc' IS NULL
           OR t->>'porcentaje_desc' = ''
           OR (t->>'porcentaje_desc')::DECIMAL(14,2) < 0
           OR (t->>'porcentaje_desc')::DECIMAL(14,2) > 100
    ) THEN
        RAISE EXCEPTION 'porcentaje_desc inválido';
    END IF;

    INSERT INTO tramo_tarifa (
        tipo,
        cantidad_minima,
        cantidad_maxima,
        porcentaje_desc,
        id_regla
    )
    SELECT
        t->>'tipo',
        (t->>'cantidad_minima')::DECIMAL(14,2),
        NULLIF(t->>'cantidad_maxima', '')::DECIMAL(14,2),
        (t->>'porcentaje_desc')::DECIMAL(14,2),
        V_ID_REGLA
    FROM jsonb_array_elements(P_TRAMOS) t;

    RAISE INFO 'Tramos agregados correctamente a la regla %', P_NOMBRE_REGLA;
END;
$$;
