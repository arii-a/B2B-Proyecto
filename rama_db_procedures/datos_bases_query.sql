---------------------------------------------
-- DATOS INICIALES
---------------------------------------------
INSERT INTO rol_usuario (nombre, descripcion) VALUES
    ('Administrador',    'Acceso total al sistema'),
    ('Gerente',          'Gestión de operaciones y reportes'),
    ('Comprador',        'Creación y seguimiento de órdenes de compra'),
    ('Vendedor',         'Gestión de productos y precios'),
    ('Almacenero',       'Gestión de stock y almacenes'),
    ('Solo lectura',     'Visualización sin permisos de edición');

INSERT INTO cargo_empresa (nombre) VALUES
    ('Gerente General'),
    ('Gerente Comercial'),
    ('Gerente Financiero'),
    ('Gerente de Operaciones'),
    ('Jefe de Compras'),
    ('Jefe de Ventas'),
    ('Jefe de Almacén'),
    ('Jefe de Contabilidad'),
    ('Ejecutivo de Ventas'),
    ('Ejecutivo de Compras'),
    ('Analista Financiero'),
    ('Analista de Logística'),
    ('Asistente Administrativo'),
    ('Asistente Contable'),
    ('Encargado de Sucursal'),
    ('Representante Comercial'),
    ('Asesor de Cuentas');

INSERT INTO categoria (nombre, descripcion) VALUES
    ('Tecnología',              'Equipos electrónicos, computadoras y accesorios tecnológicos'),
    ('Insumos de Oficina',      'Papelería, artículos de escritorio y consumibles de oficina'),
    ('Impresión y Tóner',       'Cartuchos, tóneres, impresoras y suministros de impresión'),
    ('Mobiliario de Oficina',   'Escritorios, sillas, estantes y muebles para oficina'),
    ('Limpieza e Higiene',      'Productos de limpieza y mantenimiento de instalaciones'),
    ('Redes y Conectividad',    'Cables, routers, switches y equipos de red'),
    ('Seguridad Electrónica',   'Cámaras, control de acceso y sistemas de vigilancia'),
    ('Telefonía',               'Teléfonos fijos, celulares y accesorios de comunicación'),
    ('Energía y Electricidad',  'UPS, cables eléctricos, regletas y baterías'),
    ('Software y Licencias',    'Licencias de software, antivirus y suscripciones digitales'),
    ('Almacenamiento',          'Discos duros, memorias USB, tarjetas SD y NAS'),
    ('Audio y Video',           'Proyectores, pantallas, auriculares y equipos multimedia'),
    ('Herramientas',            'Herramientas manuales y eléctricas para mantenimiento'),
    ('Embalaje y Logística',    'Cajas, cintas, empaques y materiales de despacho'),
    ('Alimentos y Bebidas',     'Snacks, café, agua y consumibles para el personal');
