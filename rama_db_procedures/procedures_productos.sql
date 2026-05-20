-- AGREGAR PRODUCTO
CREATE OR REPLACE PROCEDURE SP_AGREGAR_PRODUCTOS (
    P_NOMBRE VARCHAR,
    P_DESCRIPCION TEXT,
    P_UNIDAD_MEDIDA VARCHAR,
    P_NOMBRE_CATEGORIA VARCHAR,
    P_SKU VARCHAR
)
AS $$
DECLARE
    V_ID_CATEGORIA UUID;

BEGIN

    SELECT id_categoria
    INTO V_ID_CATEGORIA
    FROM categoria
    WHERE LOWER(nombre) = LOWER(P_NOMBRE_CATEGORIA);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'LA CATEGORIA % NO EXISTE EN LA DB', P_NOMBRE_CATEGORIA;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM producto
        WHERE sku = P_SKU
    ) THEN
        RAISE EXCEPTION 'Ya existe un producto con el SKU %', P_SKU;
    END IF;

    INSERT INTO PRODUCTO (SKU, NOMBRE, DESCRIPCION, UNIDAD_MEDIDA, ID_CATEGORIA)
    VALUES (P_SKU, P_NOMBRE, P_DESCRIPCION,P_UNIDAD_MEDIDA, V_ID_CATEGORIA);

end;
$$ LANGUAGE  plpgsql;


-- AGREGAR PRECIO BASE
CREATE OR REPLACE PROCEDURE SP_AGREGAR_PRECIO_BASE (
    P_SKU VARCHAR,
    P_NOMBRE_PROVEEDOR VARCHAR,
    P_PRECIO_BASE DECIMAL(14,2),
    P_VIGENTE_DESDE TIMESTAMP,
    P_VIGENTE_HASTA TIMESTAMP
)
AS $$
DECLARE
    V_SKU VARCHAR;
    V_ID_EMPRESA UUID;
    V_ID_PROVEEDOR UUID;
    V_ID_PRECIO_ACTIVO UUID;
BEGIN
    -- validar al proveedor
    SELECT id_empresa INTO V_ID_EMPRESA
    FROM empresa
    WHERE nombre = P_NOMBRE_PROVEEDOR;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NO EXISTEN EMPRESAS CON EL NOMBRE %.', P_NOMBRE_PROVEEDOR;
    END IF;

    SELECT id_proveedor INTO V_ID_PROVEEDOR
    FROM proveedor
    WHERE id_empresa = V_ID_EMPRESA;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NO EXISTE UNA EMPRESA PROVEEDORA CON EL NOMBRE %.', P_NOMBRE_PROVEEDOR;
    END IF;

    -- validar que el producto exista
    SELECT sku
    INTO V_SKU
    FROM producto
    WHERE sku = P_SKU;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El producto con SKU % no existe', P_SKU;
    END IF;

    -- validar que el precio sea válido
    IF P_PRECIO_BASE <= 0 THEN
        RAISE EXCEPTION 'El precio base debe ser mayor a 0';
    END IF;

    -- validar fechas
    IF P_VIGENTE_HASTA IS NOT NULL
        AND P_VIGENTE_HASTA <= P_VIGENTE_DESDE THEN
        RAISE EXCEPTION 'La fecha vigente_hasta debe ser mayor que vigente_desde';
    END IF;

    -- validar que no exista un precio base activo para ese producto y proveedor
    SELECT id_precio
    INTO V_ID_PRECIO_ACTIVO
    FROM precio_base
    WHERE sku = P_SKU
      AND id_proveedor = V_ID_PROVEEDOR
      AND (
        vigente_hasta IS NULL
            OR vigente_hasta >= CURRENT_TIMESTAMP
        )
    LIMIT 1;

    IF V_ID_PRECIO_ACTIVO IS NOT NULL THEN
        RAISE EXCEPTION 'Ya existe un precio base activo para el producto % con el proveedor %',
            P_SKU,
            V_ID_PROVEEDOR;
    END IF;

    -- insertar precio base
    INSERT INTO precio_base (
        precio_base,
        vigente_desde,
        vigente_hasta,
        id_proveedor,
        sku
    )
    VALUES (P_PRECIO_BASE,P_VIGENTE_DESDE,P_VIGENTE_HASTA,V_ID_PROVEEDOR,P_SKU);

    RAISE INFO 'Precio base agregado correctamente. Producto: %, Proveedor: %, Precio: %',
        P_SKU,
        P_NOMBRE_PROVEEDOR,
        P_PRECIO_BASE;
END;
$$ LANGUAGE plpgsql;
