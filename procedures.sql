-- crear empresa con contactos y sucursales -> validar que la empresa o contactos no existan
CREATE OR REPLACE PROCEDURE p_empresa_nueva(
    IN P_EMPRESA_DATOS JSON, IN P_EMPRESA_CONTACTOS JSON, IN P_EMPRESA_SUCURSALES JSON
) AS
    $$
    DECLARE
        -- empresa
        V_EMPRESA_ID UUID;
        V_EMPRESA_NOMBRE VARCHAR;
        V_EMPRESA_DOMINIO VARCHAR;
        V_EMPRESA_RAZON_SOCIAL VARCHAR;
        V_EMPRESA_NIT VARCHAR;

        -- contactos
        V_CONTACTOS JSON;
        V_CARGO_ID UUID;
        V_CARGO_NOMBRE VARCHAR;

        -- sucursales
        V_SUCURSALES JSON;
        V_SUCURSAL_NOMBRE VARCHAR;
    BEGIN
        V_EMPRESA_NOMBRE := P_EMPRESA_DATOS->>'nombre';
        V_EMPRESA_DOMINIO := P_EMPRESA_DATOS->>'dominio';
        V_EMPRESA_RAZON_SOCIAL := P_EMPRESA_DATOS->>'razon_social';
        V_EMPRESA_NIT := P_EMPRESA_DATOS->>'nit';

        -- verificar que la empresa no tenga datos de otras
        IF (SELECT EXISTS (SELECT 1
            FROM empresa
                WHERE nombre = V_EMPRESA_NOMBRE
                OR dominio = V_EMPRESA_DOMINIO
                OR razon_social = V_EMPRESA_RAZON_SOCIAL
                OR nit = V_EMPRESA_NIT))
        THEN
            RAISE EXCEPTION 'Ya existe una empresa con los mismos datos';
        END IF;

        -- verificar los cargos
        FOR V_CONTACTOS IN SELECT * FROM json_array_elements(P_EMPRESA_CONTACTOS)
            LOOP
                V_CARGO_NOMBRE := V_CONTACTOS ->>'cargo';

                SELECT id_cargo_empresa INTO V_CARGO_ID
                FROM cargo_empresa
                WHERE LOWER(nombre) = LOWER(v_cargo_nombre);

                IF V_CARGO_ID IS NULL THEN
                    RAISE EXCEPTION 'El cargo % no existe', V_CARGO_NOMBRE;
                END IF;
            END LOOP;

        -- verificar las sucursales
        FOR V_SUCURSALES IN SELECT * FROM json_array_elements(P_EMPRESA_SUCURSALES)
            LOOP
                V_SUCURSAL_NOMBRE := V_SUCURSALES ->>'nombre';

                IF (SELECT EXISTS (SELECT 1
                        FROM sucursal_empresa
                    WHERE LOWER(nombre) = LOWER(V_SUCURSAL_NOMBRE)))
                THEN
                    RAISE EXCEPTION 'La sucursal con el nombre % ya existe', V_SUCURSAL_NOMBRE;
                END IF;
            END LOOP;

        -- insertar empresa
        INSERT INTO empresa (nombre, razon_social, nit, dominio)
            VALUES (v_empresa_nombre, v_empresa_razon_social, v_empresa_nit, v_empresa_dominio)
        RETURNING id_empresa INTO V_EMPRESA_ID;

        -- insertar contactos
        FOR V_CONTACTOS IN SELECT * FROM json_array_elements(P_EMPRESA_CONTACTOS)
            LOOP
                SELECT id_cargo_empresa INTO v_cargo_id
                FROM cargo_empresa
                WHERE LOWER(nombre) = LOWER(V_CONTACTOS->>'cargo');

                INSERT INTO contactos_empresa (id_empresa, nombres, apellidos, id_cargo_empresa)
                VALUES (
                           v_empresa_id,
                           V_CONTACTOS->>'nombres',
                           V_CONTACTOS->>'apellidos',
                           v_cargo_id
                       );
            END LOOP;

        -- insertar sucursales
        FOR V_SUCURSALES IN SELECT * FROM json_array_elements(P_EMPRESA_SUCURSALES)
            LOOP
                INSERT INTO sucursal_empresa (id_empresa, nombre, coordenadas, direccion)
                VALUES (
                           v_empresa_id,
                           V_SUCURSALES->>'nombre',
                           NULLIF(V_SUCURSALES->>'coordenadas', 'null')::point,
                           V_SUCURSALES->>'direccion'
                       );
            END LOOP;

        RAISE INFO 'Empresa % creada con sus contactos y sucursales existosamente.', V_EMPRESA_NOMBRE;
    END;
    $$ LANGUAGE plpgsql;

-- añadir stock
CREATE OR REPLACE PROCEDURE SP_AGREGAR_STOCK(
    P_ID_ALMACEN UUID,
    P_SKU VARCHAR,
    P_CANTIDAD INT
)

AS $$
DECLARE
    V_ID_ALMACEN UUID;
    V_NOMBRE_ALMACEN VARCHAR;

    V_SKU VARCHAR;
    V_NOMBRE_PRODUCTO VARCHAR;

    V_STOCK_ACTUAL INT;
    V_STOCK_NUEVO INT;
BEGIN
    -- validar cantidad
    IF P_CANTIDAD <= 0 THEN
        RAISE EXCEPTION 'La cantidad a añadir debe ser mayor a 0. Cantidad recibida: %', P_CANTIDAD;
    END IF;

    -- validar almacén
    SELECT a.id_almacen, a.nombre
    INTO V_ID_ALMACEN, V_NOMBRE_ALMACEN
    FROM almacen a
    WHERE a.id_almacen = P_ID_ALMACEN;

    IF V_ID_ALMACEN IS NULL THEN
        RAISE EXCEPTION 'El almacen con ID % no existe', P_ID_ALMACEN;
    END IF;

    -- validar producto
    SELECT p.sku, p.nombre
    INTO V_SKU, V_NOMBRE_PRODUCTO
    FROM producto p
    WHERE p.sku = P_SKU;

    IF V_SKU IS NULL THEN
        RAISE EXCEPTION 'El producto con SKU % no existe', P_SKU;
    END IF;

    -- validar que el producto esté registrado en ese almacén
    SELECT pa.stock
    INTO V_STOCK_ACTUAL
    FROM producto_almacen pa
    WHERE pa.id_almacen = P_ID_ALMACEN
      AND pa.sku = P_SKU FOR UPDATE;

    IF V_STOCK_ACTUAL IS NULL THEN
        RAISE EXCEPTION 'El producto % no esta registrado en el almacén %', P_SKU, P_ID_ALMACEN;
    END IF;

    -- agregar stock
    UPDATE producto_almacen
    SET stock = stock + P_CANTIDAD
    WHERE id_almacen = P_ID_ALMACEN
      AND sku = P_SKU;

    -- obtener nuevo stock
    SELECT pa.stock
    INTO V_STOCK_NUEVO
    FROM producto_almacen pa
    WHERE pa.id_almacen = P_ID_ALMACEN
      AND pa.sku = P_SKU;

    RAISE INFO 'Stock agregado correctamente. Almacen: %, Producto: %, Stock anterior: %, Cantidad añadida: %, Stock nuevo: %',
        V_NOMBRE_ALMACEN,
        V_NOMBRE_PRODUCTO,
        V_STOCK_ACTUAL,
        P_CANTIDAD,
        V_STOCK_NUEVO;
END;
$$ LANGUAGE plpgsql;

-- cambiar estado orden
CREATE OR REPLACE PROCEDURE SP_CAMBIAR_ESTADO_ORDEN(
    P_ID_ORDEN UUID,
    P_NUEVO_ESTADO VARCHAR
)
    LANGUAGE plpgsql
AS $$
DECLARE
    V_ID_ORDEN UUID;
    V_ESTADO_ACTUAL VARCHAR;
    V_TOTAL DECIMAL(14,2);
BEGIN
    -- buscar la orden
    SELECT oc.id_orden, oc.id_estado, oc.total
    INTO V_ID_ORDEN, V_ESTADO_ACTUAL, V_TOTAL
    FROM orden_compra oc
    WHERE oc.id_orden = P_ID_ORDEN;

    IF V_ID_ORDEN IS NULL THEN
        RAISE EXCEPTION 'La orden con ID % no existe', P_ID_ORDEN;
    END IF;

    -- validar que el nuevo estado sea permitido
    IF P_NUEVO_ESTADO NOT IN ('aprobado', 'cancelado', 'rechazado') THEN
        RAISE EXCEPTION 'Estado invalido: %.', P_NUEVO_ESTADO;
    END IF;

    -- evitar cambiar una orden que ya fue cerrada
    IF V_ESTADO_ACTUAL != ('pendiente') THEN
        RAISE EXCEPTION 'La orden % ya tiene estado final: %', P_ID_ORDEN, V_ESTADO_ACTUAL;
    END IF;

    -- cambiar estado
    UPDATE orden_compra
    SET id_estado = P_NUEVO_ESTADO
    WHERE id_orden = P_ID_ORDEN;

    RAISE INFO 'Estado de orden actualizado correctamente. Orden: %, Estado anterior: %, Nuevo estado: %, Total: %',
        P_ID_ORDEN,
        V_ESTADO_ACTUAL,
        P_NUEVO_ESTADO,
        V_TOTAL;
END;
$$;
