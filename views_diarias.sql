-- órdenes activas
DROP VIEW IF EXISTS V_ORDENES_ACTIVAS;
CREATE OR REPLACE VIEW V_ORDENES_ACTIVAS
    AS
SELECT oc.fecha as fecha_creacion, oc.fecha_orden as fecha_limite,
       ep.razon_social as proveedor, ec.razon_social as empresa_compradora,
       u.nombre as usuario_comprador, oc.total, oc.id_estado as estado_orden
FROM orden_compra oc
       INNER JOIN proveedor p
                  ON oc.id_proveedor = p.id_proveedor
       INNER JOIN empresa ec
                  ON oc.id_empresa_compradora = ec.id_empresa
       INNER JOIN empresa ep
                  ON p.id_empresa = ep.id_empresa
       INNER JOIN usuario u
                  ON oc.id_usuario = u.id_usuario
       INNER JOIN sucursal_empresa se
                  ON oc.id_sucursal = se.id_sucursal
WHERE oc.id_estado NOT IN ('cancelado', 'rechazado');

-- órdenes que venzan en cierto día
DROP VIEW IF EXISTS V_ORDENES_POR_VENCER;
CREATE OR REPLACE VIEW V_ORDENES_POR_VENCER
    AS
SELECT oc.fecha as fecha_creacion, oc.fecha_orden as fecha_limite,
       ep.razon_social as proveedor, ec.razon_social as empresa_compradora,
       u.nombre as usuario_comprador, oc.total,
       oc.id_estado as estado_orden
FROM orden_compra oc
       INNER JOIN proveedor p
                  ON oc.id_proveedor = p.id_proveedor
       INNER JOIN empresa ec
                  ON oc.id_empresa_compradora = ec.id_empresa
       INNER JOIN empresa ep
                  ON p.id_empresa = ep.id_empresa
       INNER JOIN usuario u
                  ON oc.id_usuario = u.id_usuario
       INNER JOIN sucursal_empresa se
                  ON oc.id_sucursal = se.id_sucursal
WHERE CURRENT_DATE = fecha_orden;

-- detalle órden
DROP VIEW IF EXISTS V_DETALLE_ORDEN;
CREATE OR REPLACE VIEW V_DETALLE_ORDEN
    AS
SELECT o.id_orden as orden, o.fecha as fecha_creacion, p.nombre as producto,
       d.cantidad, d.subtotal, d.precio_unitario
FROM detalle_orden d
       INNER JOIN producto p
                  ON d.sku = p.sku
       INNER JOIN orden_compra o
                  ON d.id_orden = o.id_orden;

-- stock actual
DROP VIEW IF EXISTS V_STOCK_ALMACENES;
CREATE OR REPLACE VIEW V_STOCK_ALMACENES
    AS
SELECT a.nombre as almacen, p.nombre as producto, pa.stock,
       pa.max as maximo_stock, pa.min as minimo_stock,
       CASE
           WHEN pa.stock = 0        THEN 'Sin stock'
           WHEN pa.stock <= pa.min  THEN 'Stock bajo'
           WHEN pa.stock >= pa.max  THEN 'Stock lleno'
           ELSE 'Normal'
           END         as estado_stock
FROM producto_almacen pa
       INNER JOIN producto p
                  ON pa.sku = p.sku
       INNER JOIN almacen a
                  ON pa.id_almacen = a.id_almacen
WHERE pa.activo = TRUE;

-- contratos activos
DROP VIEW IF EXISTS V_CONTRATOS_ACTIVOS;
CREATE OR REPLACE VIEW V_CONTRATOS_ACTIVOS
    AS
SELECT ep.razon_social as empresa_proveedora, e.razon_social as empresa_compradora,
       r.nombre as regla, p.nombre as producto, ced.porcentaje_descuento,
       cet.vigente_desde, cet.vigente_hasta
FROM contrato_empresa_tarifas cet
       INNER JOIN contrato_empresa_detalle ced
                  ON cet.id_contrato = ced.id_contrato
       INNER JOIN producto p
                   ON ced.sku = p.sku
       INNER JOIN empresa e
                  ON cet.id_empresa = e.id_empresa
       INNER JOIN proveedor pro
                  ON cet.id_proveedor = pro.id_proveedor
       INNER JOIN empresa ep
                  ON pro.id_empresa = ep.id_empresa
       INNER JOIN tarifa_regla r
                  ON cet.id_regla = r.id_tarifa
WHERE cet.activo = TRUE
AND NOW() BETWEEN cet.vigente_desde AND cet.vigente_hasta;
