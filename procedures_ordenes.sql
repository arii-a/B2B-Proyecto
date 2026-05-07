CREATE OR REPLACE PROCEDURE SP_AGREGAR_ORDEN_COMPRA (
    P_NOMBRE_EMPRESA_COMPRADORA VARCHAR,
    P_NOMBRE_EMPRESA_PROVEEDORA VARCHAR,
    P_NOMBRE_SUCURSAL VARCHAR,
    P_NOMBRE_ALMACEN VARCHAR,
    P_NOMBRE_USUARIO VARCHAR,
    P_PRODUCTOS_LISTA JSONB
)
LANGUAGE plpgsql
AS $$
DECLARE
    V_ID_PROVEEDOR UUID;
    V_ID_EMPRESA_PROVEEDORA UUID;
    V_ID_EMPRESA_COMPRADORA UUID;
    V_ID_SUCURSAL UUID;
    V_ID_ALMACEN UUID;
    V_ID_USUARIO UUID;
    V_ID_ORDEN_NUEVA UUID;
    V_TOTAL DECIMAL(14,2);
    V_TIENE_CONTRATO BOOLEAN := FALSE;
BEGIN

    SELECT
        p.id_proveedor,
        e.id_empresa
    INTO
        V_ID_PROVEEDOR,
        V_ID_EMPRESA_PROVEEDORA
    FROM proveedor p
    INNER JOIN empresa e
        ON e.id_empresa = p.id_empresa
    WHERE LOWER(e.nombre) = LOWER(P_NOMBRE_EMPRESA_PROVEEDORA)
      AND e.activo = TRUE
      AND p.activo = TRUE;

    IF V_ID_PROVEEDOR IS NULL THEN
        RAISE EXCEPTION 'La empresa proveedora % no existe o no esta activa como proveedor',
            P_NOMBRE_EMPRESA_PROVEEDORA;
    END IF;

    SELECT e.id_empresa
    INTO V_ID_EMPRESA_COMPRADORA
    FROM empresa e
    WHERE LOWER(e.nombre) = LOWER(P_NOMBRE_EMPRESA_COMPRADORA)
      AND e.activo = TRUE;

    IF V_ID_EMPRESA_COMPRADORA IS NULL THEN
        RAISE EXCEPTION 'La empresa compradora % no existe o no est activa',
            P_NOMBRE_EMPRESA_COMPRADORA;
    END IF;

   
    SELECT se.id_sucursal
    INTO V_ID_SUCURSAL
    FROM sucursal_empresa se
    WHERE LOWER(se.nombre) = LOWER(P_NOMBRE_SUCURSAL)
      AND se.id_empresa = V_ID_EMPRESA_COMPRADORA
      AND se.activo = TRUE;

    IF V_ID_SUCURSAL IS NULL THEN
        RAISE EXCEPTION 'La sucursal % no existe o no pertenece a la empresa compradora %',
            P_NOMBRE_SUCURSAL,
            P_NOMBRE_EMPRESA_COMPRADORA;
    END IF;


    SELECT a.id_almacen
    INTO V_ID_ALMACEN
    FROM almacen a
    WHERE LOWER(a.nombre) = LOWER(P_NOMBRE_ALMACEN)
      AND a.id_proveedor = V_ID_PROVEEDOR
      AND a.activo = TRUE;

    IF V_ID_ALMACEN IS NULL THEN
        RAISE EXCEPTION 'El almacen % no existe, no esta activo o no pertenece al proveedor %',
            P_NOMBRE_ALMACEN,
            P_NOMBRE_EMPRESA_PROVEEDORA;
    END IF;


    SELECT u.id_usuario
    INTO V_ID_USUARIO
    FROM usuario u
    WHERE LOWER(u.nombre) = LOWER(P_NOMBRE_USUARIO)
      AND u.id_empresa = V_ID_EMPRESA_COMPRADORA
      AND u.id_sucursal = V_ID_SUCURSAL
      AND u.activo = TRUE;

    IF V_ID_USUARIO IS NULL THEN
        RAISE EXCEPTION 'El usuario % no existe o no pertenece a la empresa o a la sucursal indicada',
            P_NOMBRE_USUARIO;
    END IF;

    IF P_PRODUCTOS_LISTA IS NULL OR jsonb_array_length(P_PRODUCTOS_LISTA) = 0 THEN
        RAISE EXCEPTION 'La orden debe tener al menos un producto';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
        WHERE producto->>'sku' IS NULL
           OR producto->>'sku' = ''
    ) THEN
        RAISE EXCEPTION 'Algun producto tiene SKU nulo o vacío';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
        WHERE producto->>'cantidad' IS NULL
           OR producto->>'cantidad' = ''
           OR (producto->>'cantidad')::INT <= 0
    ) THEN
        RAISE EXCEPTION 'Todos los productos deben tener cantidad mayor a 0';
    END IF;


    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
        LEFT JOIN producto p
            ON p.sku = producto->>'sku'
        WHERE p.sku IS NULL
    ) THEN
        RAISE EXCEPTION 'Uno o más productos no existen';
    END IF;

  
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
        WHERE NOT EXISTS (
            SELECT 1
            FROM precio_base pb
            WHERE pb.sku = producto->>'sku'
              AND pb.id_proveedor = V_ID_PROVEEDOR
              AND pb.vigente_desde <= CURRENT_TIMESTAMP
              AND (
                    pb.vigente_hasta IS NULL
                    OR pb.vigente_hasta >= CURRENT_TIMESTAMP
              )
        )
    ) THEN
        RAISE EXCEPTION 'Uno o mas productos no tienen precio base vigente con el proveedor %',
            P_NOMBRE_EMPRESA_PROVEEDORA;
    END IF;

 
    IF EXISTS (
        SELECT 1
        FROM (
            SELECT
                producto->>'sku' AS sku,
                SUM((producto->>'cantidad')::INT) AS cantidad
            FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
            GROUP BY producto->>'sku'
        ) productos_pedidos
        WHERE NOT EXISTS (
            SELECT 1
            FROM producto_almacen pa
            WHERE pa.id_almacen = V_ID_ALMACEN
              AND pa.sku = productos_pedidos.sku
              AND pa.activo = TRUE
              AND pa.stock >= productos_pedidos.cantidad
        )
    ) THEN
        RAISE EXCEPTION 'No hay stock suficiente para uno o mas productos en el almacen %',
            P_NOMBRE_ALMACEN;
    END IF;

   
    SELECT EXISTS (
        SELECT 1
        FROM contrato_empresa_tarifas cet
        WHERE cet.id_empresa = V_ID_EMPRESA_COMPRADORA
          AND cet.id_proveedor = V_ID_PROVEEDOR
          AND cet.activo = TRUE
          AND cet.vigente_desde <= CURRENT_TIMESTAMP
          AND (
                cet.vigente_hasta IS NULL
                OR cet.vigente_hasta >= CURRENT_TIMESTAMP
          )
    )
    INTO V_TIENE_CONTRATO;


    WITH productos_pedidos AS (
        SELECT
            producto->>'sku' AS sku,
            SUM((producto->>'cantidad')::INT) AS cantidad
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
        GROUP BY producto->>'sku'
    ),
    precios_vigentes AS (
        SELECT
            pb.sku,
            pb.precio_base
        FROM precio_base pb
        WHERE pb.id_proveedor = V_ID_PROVEEDOR
          AND pb.vigente_desde <= CURRENT_TIMESTAMP
          AND (
                pb.vigente_hasta IS NULL
                OR pb.vigente_hasta >= CURRENT_TIMESTAMP
          )
          AND NOT EXISTS (
              SELECT 1
              FROM precio_base pb2
              WHERE pb2.sku = pb.sku
                AND pb2.id_proveedor = pb.id_proveedor
                AND pb2.vigente_desde <= CURRENT_TIMESTAMP
                AND (
                    pb2.vigente_hasta IS NULL
                    OR pb2.vigente_hasta >= CURRENT_TIMESTAMP
                )
                AND pb2.vigente_desde > pb.vigente_desde
          )
    ),
    descuento_especifico AS (
        SELECT
            ced.sku,
            MAX(ced.porcentaje_descuento) AS porcentaje_descuento
        FROM contrato_empresa_tarifas cet
        INNER JOIN contrato_empresa_detalle ced
            ON ced.id_contrato = cet.id_contrato
        WHERE cet.id_empresa = V_ID_EMPRESA_COMPRADORA
          AND cet.id_proveedor = V_ID_PROVEEDOR
          AND cet.activo = TRUE
          AND cet.vigente_desde <= CURRENT_TIMESTAMP
          AND (
                cet.vigente_hasta IS NULL
                OR cet.vigente_hasta >= CURRENT_TIMESTAMP
          )
          AND ced.sku IS NOT NULL
        GROUP BY ced.sku
    ),
    descuento_global AS (
        SELECT
            MAX(ced.porcentaje_descuento) AS porcentaje_descuento
        FROM contrato_empresa_tarifas cet
        INNER JOIN contrato_empresa_detalle ced
            ON ced.id_contrato = cet.id_contrato
        WHERE cet.id_empresa = V_ID_EMPRESA_COMPRADORA
          AND cet.id_proveedor = V_ID_PROVEEDOR
          AND cet.activo = TRUE
          AND cet.vigente_desde <= CURRENT_TIMESTAMP
          AND (
                cet.vigente_hasta IS NULL
                OR cet.vigente_hasta >= CURRENT_TIMESTAMP
          )
          AND ced.sku IS NULL
    )
    SELECT
        SUM(
            pp.cantidad
            * ROUND(
                pv.precio_base
                * (
                    1 - COALESCE(
                        de.porcentaje_descuento,
                        dg.porcentaje_descuento,
                        0
                    ) / 100
                ),
                2
            )
        )
    INTO V_TOTAL
    FROM productos_pedidos pp
    INNER JOIN precios_vigentes pv
        ON pv.sku = pp.sku
    LEFT JOIN descuento_especifico de
        ON de.sku = pp.sku
    LEFT JOIN descuento_global dg
        ON TRUE;

    IF V_TOTAL IS NULL OR V_TOTAL <= 0 THEN
        RAISE EXCEPTION 'No se pudo calcular el total de la orden';
    END IF;


    INSERT INTO orden_compra (
        total,fecha,id_proveedor, id_empresa_compradora,id_sucursal,id_usuario,id_estado,
        fecha_orden
    )
    VALUES (
        V_TOTAL,
        CURRENT_TIMESTAMP,
        V_ID_PROVEEDOR,
        V_ID_EMPRESA_COMPRADORA,
        V_ID_SUCURSAL,
        V_ID_USUARIO,
        'pendiente',
        CURRENT_DATE
    )
    RETURNING id_orden INTO V_ID_ORDEN_NUEVA;


    WITH productos_pedidos AS (
        SELECT
            producto->>'sku' AS sku,
            SUM((producto->>'cantidad')::INT) AS cantidad
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
        GROUP BY producto->>'sku'
    ),
    precios_vigentes AS (
        SELECT
            pb.sku,
            pb.precio_base
        FROM precio_base pb
        WHERE pb.id_proveedor = V_ID_PROVEEDOR
          AND pb.vigente_desde <= CURRENT_TIMESTAMP
          AND (
                pb.vigente_hasta IS NULL
                OR pb.vigente_hasta >= CURRENT_TIMESTAMP
          )
          AND NOT EXISTS (
              SELECT 1
              FROM precio_base pb2
              WHERE pb2.sku = pb.sku
                AND pb2.id_proveedor = pb.id_proveedor
                AND pb2.vigente_desde <= CURRENT_TIMESTAMP
                AND (
                    pb2.vigente_hasta IS NULL
                    OR pb2.vigente_hasta >= CURRENT_TIMESTAMP
                )
                AND pb2.vigente_desde > pb.vigente_desde
          )
    ),
    descuento_especifico AS (
        SELECT
            ced.sku,
            MAX(ced.porcentaje_descuento) AS porcentaje_descuento
        FROM contrato_empresa_tarifas cet
        INNER JOIN contrato_empresa_detalle ced
            ON ced.id_contrato = cet.id_contrato
        WHERE cet.id_empresa = V_ID_EMPRESA_COMPRADORA
          AND cet.id_proveedor = V_ID_PROVEEDOR
          AND cet.activo = TRUE
          AND cet.vigente_desde <= CURRENT_TIMESTAMP
          AND (
                cet.vigente_hasta IS NULL
                OR cet.vigente_hasta >= CURRENT_TIMESTAMP
          )
          AND ced.sku IS NOT NULL
        GROUP BY ced.sku
    ),
    descuento_global AS (
        SELECT
            MAX(ced.porcentaje_descuento) AS porcentaje_descuento
        FROM contrato_empresa_tarifas cet
        INNER JOIN contrato_empresa_detalle ced
            ON ced.id_contrato = cet.id_contrato
        WHERE cet.id_empresa = V_ID_EMPRESA_COMPRADORA
          AND cet.id_proveedor = V_ID_PROVEEDOR
          AND cet.activo = TRUE
          AND cet.vigente_desde <= CURRENT_TIMESTAMP
          AND (
                cet.vigente_hasta IS NULL
                OR cet.vigente_hasta >= CURRENT_TIMESTAMP
          )
          AND ced.sku IS NULL
    ),
    precios_finales AS (
        SELECT
            pp.sku,
            pp.cantidad,
            ROUND(
                pv.precio_base
                * (
                    1 - COALESCE(
                        de.porcentaje_descuento,
                        dg.porcentaje_descuento,
                        0
                    ) / 100
                ),
                2
            ) AS precio_final
        FROM productos_pedidos pp
        INNER JOIN precios_vigentes pv
            ON pv.sku = pp.sku
        LEFT JOIN descuento_especifico de
            ON de.sku = pp.sku
        LEFT JOIN descuento_global dg
            ON TRUE
    )
    INSERT INTO detalle_orden (cantidad,precio_unitario,subtotal,id_orden,sku,id_almacen
    )
    SELECT cantidad,precio_final,cantidad * precio_final,V_ID_ORDEN_NUEVA,
        sku, V_ID_ALMACEN
    FROM precios_finales;

 
    UPDATE producto_almacen pa
    SET stock = pa.stock - productos_pedidos.cantidad
    FROM (
        SELECT
            producto->>'sku' AS sku,
            SUM((producto->>'cantidad')::INT) AS cantidad
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
        GROUP BY producto->>'sku'
    ) productos_pedidos
    WHERE pa.id_almacen = V_ID_ALMACEN
      AND pa.sku = productos_pedidos.sku
      AND pa.activo = TRUE
      AND pa.stock >= productos_pedidos.cantidad;

    IF V_TIENE_CONTRATO THEN
        RAISE INFO 'Orden creada con contrato aplicado. ID orden: %, Total final: %',
            V_ID_ORDEN_NUEVA,
            V_TOTAL;
    ELSE
        RAISE INFO 'Orden creada sin contrato aplicado. ID orden: %, Total: %',
            V_ID_ORDEN_NUEVA,
            V_TOTAL;
    END IF;
END;
$$;
