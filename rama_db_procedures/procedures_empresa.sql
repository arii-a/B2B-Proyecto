-- PROCEDURES
-- datos como contactos, sucursales, almacenes, y tramos de precio serán enviados como un JSONB

-- crear empresa con contactos y sucursales -> validar que la empresa o contactos no existan
DROP PROCEDURE p_empresa_nueva(p_empresa_datos json, p_empresa_contactos json, p_empresa_sucursales json);
CREATE OR REPLACE PROCEDURE p_empresa_nueva(
    IN P_EMPRESA_DATOS JSONB, IN P_EMPRESA_CONTACTOS JSONB, IN P_EMPRESA_SUCURSALES JSONB
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
        V_CONTACTOS JSONB;
        V_CARGO_ID UUID;
        V_CARGO_NOMBRE VARCHAR;

        -- sucursales
        V_SUCURSALES JSONB;
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
        FOR V_CONTACTOS IN SELECT * FROM JSONB_array_elements(P_EMPRESA_CONTACTOS)
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
        FOR V_SUCURSALES IN SELECT * FROM JSONB_array_elements(P_EMPRESA_SUCURSALES)
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
        FOR V_CONTACTOS IN SELECT * FROM JSONB_array_elements(P_EMPRESA_CONTACTOS)
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
        FOR V_SUCURSALES IN SELECT * FROM JSONB_array_elements(P_EMPRESA_SUCURSALES)
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


--- poner como proveedora a una empresa y su comision
DROP PROCEDURE SP_AGREGAR_EMPRESA_PROVEEDORA(P_NOMBRE_EMPRESA VARCHAR, P_DATOS_COMISION JSON, P_ALMACENES JSON);
CREATE OR REPLACE PROCEDURE SP_AGREGAR_EMPRESA_PROVEEDORA (
    P_NOMBRE_EMPRESA     VARCHAR,
    P_DATOS_COMISION     JSONB,
    P_ALMACENES          JSONB
)
AS $$
DECLARE
    V_ID_EMPRESA        UUID;
    V_ID_PROVEEDOR      UUID;
    V_ALMACEN           JSONB;
    V_TIPO_COMISION     VARCHAR;
    V_VALOR_COMISION    NUMERIC;
    V_NOMBRE_COMISION   VARCHAR;
    V_FECHA_FIN         TIMESTAMP;
BEGIN
    -- verificar existencia de la empresa
    SELECT id_empresa INTO V_ID_EMPRESA
    FROM empresa
    WHERE LOWER(nombre) = LOWER(P_NOMBRE_EMPRESA);

    IF NOT FOUND THEN
        RAISE EXCEPTION 'La empresa con nombre % no existe.', P_NOMBRE_EMPRESA;
    END IF;

    -- verificar que no sea ya proveedora
    IF EXISTS (SELECT 1 FROM proveedor WHERE id_empresa = V_ID_EMPRESA) THEN
        RAISE EXCEPTION 'La empresa % ya está registrada como proveedora.', P_NOMBRE_EMPRESA;
    END IF;

    -- extraer datos comision
    V_NOMBRE_COMISION := P_DATOS_COMISION->>'nombre';
    V_TIPO_COMISION   := LOWER(P_DATOS_COMISION->>'tipo');
    V_VALOR_COMISION  := (P_DATOS_COMISION->>'valor')::NUMERIC;
    V_FECHA_FIN       := NULLIF(P_DATOS_COMISION->>'fecha_fin', '')::TIMESTAMP;

    -- validar tipo
    IF V_TIPO_COMISION NOT IN ('porcentaje', 'fijo') THEN
        RAISE EXCEPTION 'El tipo de comisión debe ser porcentaje o fijo. % no es válido.', V_TIPO_COMISION;
    END IF;

    -- validar valor
    IF V_VALOR_COMISION < 0 THEN
        RAISE EXCEPTION 'El valor de la comisión no puede ser negativo.';
    END IF;

    IF V_TIPO_COMISION = 'porcentaje' AND V_VALOR_COMISION > 100 THEN
        RAISE EXCEPTION 'El porcentaje de comisión no puede ser mayor a 100.';
    END IF;

    -- validar almacenes
    IF P_ALMACENES IS NULL OR JSONB_array_length(P_ALMACENES) = 0 THEN
        RAISE EXCEPTION 'Debe enviar al menos un almacén.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM JSONB_array_elements(P_ALMACENES) AS a
        WHERE a->>'nombre' IS NULL OR a->>'nombre' = ''
    ) THEN
        RAISE EXCEPTION 'Todos los almacenes deben tener nombre.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM JSONB_array_elements(P_ALMACENES) AS a
                          JOIN almacen al ON LOWER(al.nombre) = LOWER(a->>'nombre')
    ) THEN
        RAISE EXCEPTION 'Uno o más almacenes ya existen con ese nombre.';
    END IF;

    -- insertar proveedor
    INSERT INTO proveedor (activo, id_empresa)
    VALUES (TRUE, V_ID_EMPRESA)
    RETURNING id_proveedor INTO V_ID_PROVEEDOR;

    -- insertar regla de comision
    INSERT INTO reglas_comision (nombre, id_proveedor, id_tipo, valor, fecha_inicio, fecha_final)
    VALUES (V_NOMBRE_COMISION, V_ID_PROVEEDOR, V_TIPO_COMISION,
            V_VALOR_COMISION, CURRENT_TIMESTAMP, V_FECHA_FIN);

    -- insertar almacenes
    FOR V_ALMACEN IN SELECT * FROM JSONB_array_elements(P_ALMACENES)
        LOOP
            INSERT INTO almacen (nombre, direccion, coordenadas, activo, id_proveedor)
            VALUES (
                       V_ALMACEN->>'nombre',
                       V_ALMACEN->>'direccion',
                       NULLIF(V_ALMACEN->>'coordenadas', '')::point,
                       TRUE,
                       V_ID_PROVEEDOR
                   );
        END LOOP;

    RAISE INFO 'Proveedor creado para la empresa %, con regla de comisión y % almacén/es.',
        P_NOMBRE_EMPRESA, JSONB_array_length(P_ALMACENES);
END;
$$ LANGUAGE plpgsql;

