CREATE OR REPLACE PROCEDURE SP_AGREGAR_ORDEN_COMPRA (
    P_NOMBRE_EMPRESA_COMPRADORA VARCHAR,
    P_NOMBRE_EMPRESA_PROVEEDORA VARCHAR,
    P_NOMBRE_SUCURSAL VARCHAR,
    P_NOMBRE_ALMACEN VARCHAR,
    P_NOMBRE_USUARIO VARCHAR,
    P_PRODUCTOS_LISTA JSONB
)
    
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
    WHERE e.nombre = P_NOMBRE_EMPRESA_PROVEEDORA
      AND e.activo = TRUE
      AND p.activo = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La empresa proveedora % no existe o no esta activa como proveedor',
            P_NOMBRE_EMPRESA_PROVEEDORA;
    END IF;

    SELECT e.id_empresa
    INTO V_ID_EMPRESA_COMPRADORA
    FROM empresa e
    WHERE e.nombre = P_NOMBRE_EMPRESA_COMPRADORA
      AND e.activo = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La empresa compradora % no existe o no está activa',
            P_NOMBRE_EMPRESA_COMPRADORA;
    END IF;

    SELECT se.id_sucursal
    INTO V_ID_SUCURSAL
    FROM sucursal_empresa se
    WHERE se.nombre = P_NOMBRE_SUCURSAL
      AND se.id_empresa = V_ID_EMPRESA_COMPRADORA
      AND se.activo = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La sucursal % no existe o no pertenece a la empresa compradora %',
            P_NOMBRE_SUCURSAL,
            P_NOMBRE_EMPRESA_COMPRADORA;
    END IF;

    SELECT id_almacen INTO V_ID_ALMACEN
        FROM almacen a
    INNER JOIN proveedor p2
        ON a.id_proveedor = p2.id_proveedor
    WHERE a.nombre = P_NOMBRE_ALMACEN;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El almacen % no existe.', P_NOMBRE_ALMACEN;
    END IF;

    SELECT u.id_usuario
    INTO V_ID_USUARIO
    FROM usuario u
    WHERE u.nombre = P_NOMBRE_USUARIO
      AND u.id_empresa = V_ID_EMPRESA_COMPRADORA
      AND u.id_sucursal = V_ID_SUCURSAL
      AND u.activo = TRUE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El usuario % no existe o no pertenece a la empresa o la sucursal indicada',
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
        RAISE EXCEPTION 'Algun producto tiene nulo o no tiene SKU';
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
        RAISE EXCEPTION 'Uno o mas productos no existen';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
                 LEFT JOIN precio_base pb
                           ON pb.sku = producto->>'sku'
                               AND pb.id_proveedor = V_ID_PROVEEDOR
                               AND pb.vigente_desde <= CURRENT_TIMESTAMP
                               AND (
                                  pb.vigente_hasta IS NULL
                                      OR pb.vigente_hasta >= CURRENT_TIMESTAMP
                                  )
        WHERE pb.id_precio IS NULL
    ) THEN
        RAISE EXCEPTION 'Uno o más productos no tienen precio base vigente con el proveedor %',
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
            FROM almacen a
                     INNER JOIN producto_almacen pa
                                ON pa.id_almacen = a.id_almacen
            WHERE a.id_proveedor = V_ID_PROVEEDOR
              AND a.activo = TRUE
              AND pa.activo = TRUE
              AND pa.sku = productos_pedidos.sku
              AND pa.stock >= productos_pedidos.cantidad
        )
    ) THEN
        RAISE EXCEPTION 'No hay stock suficiente para uno o más productos';
    END IF;

    SELECT SUM(productos_pedidos.cantidad * pb.precio_base)
    INTO V_TOTAL
    FROM (
             SELECT
                 producto->>'sku' AS sku,
                 SUM((producto->>'cantidad')::INT) AS cantidad
             FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
             GROUP BY producto->>'sku'
         ) productos_pedidos
             INNER JOIN precio_base pb
                        ON pb.sku = productos_pedidos.sku
                            AND pb.id_proveedor = V_ID_PROVEEDOR
                            AND pb.vigente_desde <= CURRENT_TIMESTAMP
                            AND (
                               pb.vigente_hasta IS NULL
                                   OR pb.vigente_hasta >= CURRENT_TIMESTAMP
                               );

    INSERT INTO orden_compra (
        total,
        fecha,
        id_proveedor,
        id_empresa_compradora,
        id_sucursal,
        id_usuario,
        id_estado,
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

    INSERT INTO detalle_orden (
    cantidad,
    precio_unitario,
    subtotal,
    id_orden,
    sku,
    id_almacen
)
SELECT
    productos_pedidos.cantidad,
    pb.precio_base,
    productos_pedidos.cantidad * pb.precio_base,
    V_ID_ORDEN_NUEVA,
    productos_pedidos.sku,
    V_ID_ALMACEN
FROM (
    SELECT
        producto->>'sku' AS sku,
        SUM((producto->>'cantidad')::INT) AS cantidad
    FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
    GROUP BY producto->>'sku'
) productos_pedidos
INNER JOIN precio_base pb
    ON pb.sku = productos_pedidos.sku
   AND pb.id_proveedor = V_ID_PROVEEDOR
   AND pb.vigente_desde <= CURRENT_TIMESTAMP
   AND (
        pb.vigente_hasta IS NULL
        OR pb.vigente_hasta >= CURRENT_TIMESTAMP
   );

    UPDATE producto_almacen pa
    SET stock = pa.stock - productos_pedidos.cantidad
    FROM (
             SELECT
                 producto->>'sku' AS sku,
                 SUM((producto->>'cantidad')::INT) AS cantidad
             FROM jsonb_array_elements(P_PRODUCTOS_LISTA) AS producto
             GROUP BY producto->>'sku'
         ) productos_pedidos
             INNER JOIN almacen a
                        ON a.id_proveedor = V_ID_PROVEEDOR
    WHERE pa.id_almacen = a.id_almacen
      AND pa.sku = productos_pedidos.sku
      AND a.activo = TRUE
      AND pa.activo = TRUE
      AND pa.stock >= productos_pedidos.cantidad;

    RAISE INFO 'orden creada correctamente. ID orden: %, Total: %',
        V_ID_ORDEN_NUEVA,
        V_TOTAL;
END;
$$ LANGUAGE plpgsql;
