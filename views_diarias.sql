-- órdenes activas
CREATE OR REPLACE VIEW V_ORDENES_ACTIVAS
    AS
SELECT oc.fecha as fecha_creacion, oc.fecha_orden as fecha_limite,
       ep.razon_social as proveedor, ec.razon_social as empresa_compradora,
       u.nombre as usuario_comprador, oc.id_estado as estado_orden
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
                  ON ep.id_empresa = se.id_empresa;

-- órdenes que venzan en cierto día
CREATE OR REPLACE VIEW V_ORDENES_POR_VENCER
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
                  ON ep.id_empresa = se.id_empresa
WHERE CURRENT_DATE = fecha_orden;

-- detalle órden
CREATE OR REPLACE VIEW V_DETALLE_ORDEN
    AS
SELECT o.fecha as fecha_creacion, p.nombre as producto,
       d.cantidad, d.subtotal, d.precio_unitario
FROM detalle_orden d
       INNER JOIN producto p
                  ON d.sku = p.sku
       INNER JOIN orden_compra o
                  ON d.id_orden = o.id_orden;

-- stock actual
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
       INNER JOIN reglas_comision r
                  ON pro.id_proveedor = r.id_proveedor
WHERE cet.activo = TRUE;