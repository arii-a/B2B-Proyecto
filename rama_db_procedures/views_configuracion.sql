-- tramos por regla
DROP VIEW IF EXISTS V_TRAMOS_REGLAS;
CREATE OR REPLACE VIEW V_TRAMOS_REGLAS
    AS
SELECT r.nombre, t.tipo, t.cantidad_maxima,
       t.cantidad_minima, t.porcentaje_desc,e.razon_social
FROM tarifa_regla r
    INNER JOIN tramo_tarifa t
               ON r.id_tarifa = t.id_regla
    INNER JOIN proveedor p
               ON r.id_proveedor = p.id_proveedor
    INNER JOIN empresa e
               ON p.id_empresa = e.id_empresa;

-- contratos por vencer en menos de un mes
DROP VIEW IF EXISTS V_CONTRATOS_POR_VENCER;
CREATE OR REPLACE VIEW V_CONTRATOS_POR_VENCER
AS
SELECT ep.razon_social as proveedor, ec.razon_social as empresa_socia,
       tr.nombre as regla_contrato, cet.vigente_hasta, cet.activo
FROM contrato_empresa_tarifas cet
         INNER JOIN proveedor p
                    ON cet.id_proveedor = p.id_proveedor
         INNER JOIN empresa ep
                    ON ep.id_empresa = p.id_empresa
         INNER JOIN empresa ec
                    ON cet.id_empresa = ec.id_empresa
         INNER JOIN tarifa_regla tr
                    ON cet.id_regla = tr.id_tarifa
WHERE cet.vigente_hasta <= CURRENT_DATE + INTERVAL '30 days';

-- productos sin stock
DROP VIEW IF EXISTS V_PRODUCTOS_SIN_STOCK;
CREATE OR REPLACE VIEW V_PRODUCTOS_SIN_STOCK
AS
SELECT e.razon_social, a.nombre as almacen, p.nombre, p.sku, pa.stock
FROM producto_almacen pa
LEFT JOIN producto p
ON pa.sku = p.sku
INNER JOIN almacen a
ON pa.id_almacen = a.id_almacen
INNER JOIN proveedor p2
ON a.id_proveedor = p2.id_proveedor
INNER JOIN empresa e
ON p2.id_empresa = e.id_empresa
WHERE pa.stock = 0
AND a.activo = TRUE;
