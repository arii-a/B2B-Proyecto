-- comisiones por proveedor
DROP VIEW IF EXISTS V_COMISIONES_PROVEEDOR;
CREATE OR REPLACE VIEW V_COMISIONES_PROVEEDOR
    AS
SELECT ep.razon_social AS proveedor, SUM(c.monto_comision) AS total_comisiones,
       SUM(c.monto_proveedor) AS total_proveedor, COUNT(c.id_comision) AS cantidad_comisiones,
       MIN(c.fecha) AS primera_comision, MAX(c.fecha) AS ultima_comision
FROM comision c
         INNER JOIN proveedor p
             ON c.id_proveedor = p.id_proveedor
         INNER JOIN empresa ep
             ON p.id_empresa = ep.id_empresa
GROUP BY ep.razon_social;

-- detalle de comision por orden
DROP VIEW IF EXISTS V_COMISIONES_DETALLE;
CREATE OR REPLACE VIEW V_COMISIONES_DETALLE
    AS
SELECT ep.razon_social AS proveedor,
       ec.razon_social AS empresa_compradora, oc.id_orden,
       oc.fecha AS fecha_orden, prod.nombre AS producto,
       d.cantidad, d.precio_unitario, d.subtotal, c.monto_comision,
       c.monto_proveedor, c.fecha AS fecha_comision
FROM comision c
        INNER JOIN detalle_orden d
            ON c.id_detalle_orden = d.id_detalle
        INNER JOIN orden_compra oc
            ON d.id_orden = oc.id_orden
        INNER JOIN producto prod
            ON d.sku = prod.sku
        INNER JOIN proveedor p
            ON c.id_proveedor = p.id_proveedor
        INNER JOIN empresa ep
            ON p.id_empresa = ep.id_empresa
        INNER JOIN empresa ec
            ON oc.id_empresa_compradora = ec.id_empresa;

-- resumen de órdenes por empresa compradora
DROP VIEW IF EXISTS V_RESUMEN_ORDENES_EMPRESA;
CREATE OR REPLACE VIEW V_RESUMEN_ORDENES_EMPRESA
    AS
SELECT ec.razon_social AS empresa_compradora, COUNT(oc.id_orden) AS total_ordenes,
       SUM(oc.total) AS monto_total_comprado, AVG(oc.total) AS promedio_por_orden,
       MAX(oc.total) AS orden_mas_alta, MIN(oc.total) AS orden_mas_baja,
       COUNT(CASE WHEN oc.id_estado = 'pendiente'  THEN 1 END) AS ordenes_pendientes,
       COUNT(CASE WHEN oc.id_estado = 'aprobado'   THEN 1 END) AS ordenes_aprobadas,
       COUNT(CASE WHEN oc.id_estado = 'cancelado'  THEN 1 END) AS ordenes_canceladas
FROM orden_compra oc
         JOIN empresa ec ON oc.id_empresa_compradora = ec.id_empresa
GROUP BY ec.razon_social;

-- facturas pendientes de pago
DROP VIEW IF EXISTS V_FACTURAS_PENDIENTES;
CREATE OR REPLACE VIEW V_FACTURAS_PENDIENTES
    AS
SELECT f.id_factura, f.fecha AS fecha_factura,
       ec.razon_social AS empresa_compradora, ep.razon_social AS proveedor,
       oc.id_orden, f.total, f.id_estado AS estado_factura,
       CURRENT_DATE - f.fecha::DATE AS dias_pendiente
FROM factura f
         JOIN orden_compra oc    ON f.id_orden = oc.id_orden
         JOIN empresa ec         ON oc.id_empresa_compradora = ec.id_empresa
         JOIN proveedor p        ON oc.id_proveedor = p.id_proveedor
         JOIN empresa ep         ON p.id_empresa = ep.id_empresa
WHERE f.id_estado = 'pendiente';

-------- PARA EMPRESAS
-- productos más comprados
DROP VIEW IF EXISTS V_PRODUCTOS_MAS_COMPRADOS;
CREATE OR REPLACE VIEW V_PRODUCTOS_MAS_COMPRADOS
    AS
SELECT prod.sku, prod.nombre AS producto,
       cat.nombre AS categoria, SUM(d.cantidad) AS unidades_vendidas,
       SUM(d.subtotal) AS monto_total, AVG(d.precio_unitario) AS precio_promedio,
       COUNT(DISTINCT d.id_orden) AS aparece_en_ordenes
FROM detalle_orden d
        INNER JOIN producto prod
            ON d.sku = prod.sku
        INNER JOIN categoria cat
            ON prod.id_categoria = cat.id_categoria
        INNER JOIN orden_compra oc
            ON d.id_orden = oc.id_orden
WHERE oc.id_estado NOT IN ('cancelado', 'rechazado')
GROUP BY prod.sku, prod.nombre, cat.nombre;

-- proveedores con más ventas
DROP VIEW IF EXISTS V_PROVEEDORES_MAS_COMPRADOS;
CREATE OR REPLACE VIEW V_PROVEEDORES_MAS_COMPRADOS
    AS
SELECT e.razon_social as proveedor, COUNT(DISTINCT d.id_orden) AS ventas
FROM proveedor pro
         INNER JOIN empresa e
                    ON pro.id_empresa = e.id_empresa
         INNER JOIN orden_compra oc
                    ON pro.id_proveedor = oc.id_proveedor
        INNER JOIN detalle_orden d
                   ON oc.id_orden = d.id_orden
WHERE oc.id_estado NOT IN ('cancelado', 'rechazado')
GROUP BY e.razon_social;

